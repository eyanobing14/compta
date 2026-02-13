import { getDb } from "./db";
import {
  BilanData,
  BilanFilters,
  BilanLine,
  BilanSection,
} from "../types/bilan";

/**
 * Calcule le solde d'un compte à une date donnée
 */
async function getSoldeCompteAu(
  compteNumero: string,
  date: string,
): Promise<number> {
  try {
    const db = await getDb();

    const result = await db.select<{ solde: number }[]>(
      `SELECT 
        COALESCE(SUM(CASE 
          WHEN compte_debit = ? THEN montant 
          ELSE 0 
        END), 0) - 
        COALESCE(SUM(CASE 
          WHEN compte_credit = ? THEN montant 
          ELSE 0 
        END), 0) as solde
      FROM ecritures
      WHERE date <= ?`,
      [compteNumero, compteNumero, date],
    );

    return result[0]?.solde || 0;
  } catch (error) {
    console.error(`Erreur getSoldeCompteAu pour ${compteNumero}:`, error);
    throw error;
  }
}

/**
 * Récupère tous les comptes d'actif (classes 2 et 3)
 */
async function getComptesActif(): Promise<
  Array<{ numero: string; libelle: string }>
> {
  try {
    const db = await getDb();
    return await db.select<Array<{ numero: string; libelle: string }>>(
      `SELECT numero, libelle 
       FROM comptes 
       WHERE type_compte = 'ACTIF' 
       ORDER BY numero`,
    );
  } catch (error) {
    console.error("Erreur getComptesActif:", error);
    throw error;
  }
}

/**
 * Récupère tous les comptes de passif (classe 4)
 */
async function getComptesPassif(): Promise<
  Array<{ numero: string; libelle: string }>
> {
  try {
    const db = await getDb();
    return await db.select<Array<{ numero: string; libelle: string }>>(
      `SELECT numero, libelle 
       FROM comptes 
       WHERE type_compte = 'PASSIF' 
       ORDER BY numero`,
    );
  } catch (error) {
    console.error("Erreur getComptesPassif:", error);
    throw error;
  }
}

/**
 * Calcule le résultat à une date donnée (pour les capitaux propres)
 */
async function getResultatAu(date: string): Promise<number> {
  try {
    const db = await getDb();

    // Total produits (comptes 7)
    const produits = await db.select<{ total: number }[]>(
      `SELECT COALESCE(SUM(montant), 0) as total
       FROM ecritures
       WHERE compte_credit LIKE '7%' AND date <= ?`,
      [date],
    );

    // Total charges (comptes 6)
    const charges = await db.select<{ total: number }[]>(
      `SELECT COALESCE(SUM(montant), 0) as total
       FROM ecritures
       WHERE compte_debit LIKE '6%' AND date <= ?`,
      [date],
    );

    return (produits[0]?.total || 0) - (charges[0]?.total || 0);
  } catch (error) {
    console.error("Erreur getResultatAu:", error);
    throw error;
  }
}

/**
 * Calcule le bilan comparatif entre deux dates
 */
export async function getBilanComparatif(
  filters: BilanFilters,
): Promise<BilanData> {
  try {
    // Récupérer les comptes
    const comptesActif = await getComptesActif();
    const comptesPassif = await getComptesPassif();

    // Calculer le résultat aux deux dates
    const resultatInitial = await getResultatAu(filters.dateInitiale);
    const resultatFinal = await getResultatAu(filters.dateFinale);

    // Traitement de l'actif
    const actifLignes: BilanLine[] = [];
    let totalActifInitial = 0;
    let totalActifFinal = 0;

    for (const compte of comptesActif) {
      const soldeInitial = await getSoldeCompteAu(
        compte.numero,
        filters.dateInitiale,
      );
      const soldeFinal = await getSoldeCompteAu(
        compte.numero,
        filters.dateFinale,
      );

      // Pour l'actif, on prend la valeur absolue (normalement positif)
      const montantInitial = Math.abs(soldeInitial);
      const montantFinal = Math.abs(soldeFinal);

      if (montantInitial > 0 || montantFinal > 0) {
        const variation = montantFinal - montantInitial;
        const variation_pourcentage =
          montantInitial !== 0 ? (variation / montantInitial) * 100 : 0;

        actifLignes.push({
          compte_numero: compte.numero,
          compte_libelle: compte.libelle,
          montant_initial: montantInitial,
          montant_final: montantFinal,
          variation,
          variation_pourcentage,
        });

        totalActifInitial += montantInitial;
        totalActifFinal += montantFinal;
      }
    }

    // Traitement du passif (hors capitaux propres)
    const passifLignes: BilanLine[] = [];
    let totalPassifInitial = 0;
    let totalPassifFinal = 0;

    for (const compte of comptesPassif) {
      const soldeInitial = await getSoldeCompteAu(
        compte.numero,
        filters.dateInitiale,
      );
      const soldeFinal = await getSoldeCompteAu(
        compte.numero,
        filters.dateFinale,
      );

      // Pour le passif, on prend la valeur absolue (normalement positif)
      const montantInitial = Math.abs(soldeInitial);
      const montantFinal = Math.abs(soldeFinal);

      if (montantInitial > 0 || montantFinal > 0) {
        const variation = montantFinal - montantInitial;
        const variation_pourcentage =
          montantInitial !== 0 ? (variation / montantInitial) * 100 : 0;

        passifLignes.push({
          compte_numero: compte.numero,
          compte_libelle: compte.libelle,
          montant_initial: montantInitial,
          montant_final: montantFinal,
          variation,
          variation_pourcentage,
        });

        totalPassifInitial += montantInitial;
        totalPassifFinal += montantFinal;
      }
    }

    // Capitaux propres (incluant le résultat)
    const capitauxLignes: BilanLine[] = [
      {
        compte_numero: "10",
        compte_libelle: "Capital",
        montant_initial: 1000000, // À configurer plus tard
        montant_final: 1000000,
        variation: 0,
        variation_pourcentage: 0,
      },
      {
        compte_numero: "12",
        compte_libelle: "Résultat de l'exercice",
        montant_initial: resultatInitial,
        montant_final: resultatFinal,
        variation: resultatFinal - resultatInitial,
        variation_pourcentage:
          resultatInitial !== 0
            ? ((resultatFinal - resultatInitial) / resultatInitial) * 100
            : 0,
      },
    ];

    const totalCapitauxInitial = capitauxLignes.reduce(
      (sum, l) => sum + l.montant_initial,
      0,
    );
    const totalCapitauxFinal = capitauxLignes.reduce(
      (sum, l) => sum + l.montant_final,
      0,
    );

    return {
      actif: {
        titre: "ACTIF",
        total_initial: totalActifInitial,
        total_final: totalActifFinal,
        variation: totalActifFinal - totalActifInitial,
        lignes: actifLignes,
      },
      passif: {
        titre: "PASSIF (dettes)",
        total_initial: totalPassifInitial,
        total_final: totalPassifFinal,
        variation: totalPassifFinal - totalPassifInitial,
        lignes: passifLignes,
      },
      capitaux_propres: {
        titre: "CAPITAUX PROPRES",
        total_initial: totalCapitauxInitial,
        total_final: totalCapitauxFinal,
        variation: totalCapitauxFinal - totalCapitauxInitial,
        lignes: capitauxLignes,
      },
      total_actif: {
        initial: totalActifInitial,
        final: totalActifFinal,
        variation: totalActifFinal - totalActifInitial,
      },
      total_passif: {
        initial: totalPassifInitial + totalCapitauxInitial,
        final: totalPassifFinal + totalCapitauxFinal,
        variation:
          totalPassifFinal +
          totalCapitauxFinal -
          (totalPassifInitial + totalCapitauxInitial),
      },
      dates: {
        initial: filters.dateInitiale,
        final: filters.dateFinale,
      },
    };
  } catch (error) {
    console.error("Erreur getBilanComparatif:", error);
    throw error;
  }
}

/**
 * Exporte le bilan au format CSV
 */
export async function exportBilanToCSV(filters: BilanFilters): Promise<string> {
  try {
    const data = await getBilanComparatif(filters);

    const headers = [
      "Rubrique",
      "Compte",
      `Initial (${data.dates.initial})`,
      `Final (${data.dates.final})`,
      "Variation",
      "Variation %",
    ];

    const rows: string[] = [];

    // Fonction pour ajouter une section
    const addSection = (section: BilanSection) => {
      rows.push(`"${section.titre}"`);
      for (const ligne of section.lignes) {
        rows.push(
          [
            `"${ligne.compte_libelle.replace(/"/g, '""')}"`,
            ligne.compte_numero,
            ligne.montant_initial.toString(),
            ligne.montant_final.toString(),
            ligne.variation.toString(),
            ligne.variation_pourcentage.toFixed(1) + "%",
          ].join(","),
        );
      }
      rows.push(
        [
          `"TOTAL ${section.titre}"`,
          "",
          section.total_initial.toString(),
          section.total_final.toString(),
          section.variation.toString(),
          ((section.variation / (section.total_initial || 1)) * 100).toFixed(
            1,
          ) + "%",
        ].join(","),
      );
      rows.push("");
    };

    // Ajouter les sections
    addSection(data.actif);
    addSection(data.passif);
    addSection(data.capitaux_propres);

    // Total général
    rows.push(
      [
        "TOTAL BILAN",
        "",
        data.total_actif.initial.toString(),
        data.total_actif.final.toString(),
        data.total_actif.variation.toString(),
        (
          (data.total_actif.variation / (data.total_actif.initial || 1)) *
          100
        ).toFixed(1) + "%",
      ].join(","),
    );

    return [headers.join(","), ...rows].join("\n");
  } catch (error) {
    console.error("Erreur exportBilanToCSV:", error);
    throw error;
  }
}
