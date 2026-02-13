import { getDb } from "./db";
import {
  CompteResultatData,
  ResultatLine,
  ResultatFilters,
  PeriodeType,
} from "../types/resultat";

/**
 * Obtient la période en fonction des filtres
 */
function getPeriodeFromFilters(filters: ResultatFilters): {
  debut: string;
  fin: string;
  libelle: string;
} {
  const now = new Date();
  let debut: Date;
  let fin: Date;
  let libelle: string;

  switch (filters.periodeType) {
    case "mois":
      const annee = filters.annee || now.getFullYear();
      const mois = filters.mois || now.getMonth() + 1;
      debut = new Date(annee, mois - 1, 1);
      fin = new Date(annee, mois, 0);
      libelle = `${debut.toLocaleDateString("fr-BI", { month: "long", year: "numeric" })}`;
      break;

    case "trimestre":
      const anneeT = filters.annee || now.getFullYear();
      const trimestre =
        filters.trimestre || Math.floor((now.getMonth() + 3) / 3);
      const moisDebut = (trimestre - 1) * 3;
      debut = new Date(anneeT, moisDebut, 1);
      fin = new Date(anneeT, moisDebut + 3, 0);
      libelle = `${trimestre}e trimestre ${anneeT}`;
      break;

    case "annee":
      const anneeA = filters.annee || now.getFullYear();
      debut = new Date(anneeA, 0, 1);
      fin = new Date(anneeA, 11, 31);
      libelle = `Exercice ${anneeA}`;
      break;

    case "personnalisee":
    default:
      debut = new Date(filters.dateDebut || now);
      fin = new Date(filters.dateFin || now);
      libelle = `Du ${debut.toLocaleDateString("fr-BI")} au ${fin.toLocaleDateString("fr-BI")}`;
      break;
  }

  return {
    debut: debut.toISOString().split("T")[0],
    fin: fin.toISOString().split("T")[0],
    libelle,
  };
}

/**
 * Calcule le compte de résultat pour une période donnée
 */
export async function getCompteResultat(
  filters: ResultatFilters,
): Promise<CompteResultatData> {
  try {
    const db = await getDb();
    const periode = getPeriodeFromFilters(filters);

    // Récupérer tous les comptes de produits (classe 7) et charges (classe 6)
    const query = `
      SELECT 
        c.numero,
        c.libelle,
        c.type_compte,
        COALESCE(SUM(CASE 
          WHEN c.type_compte = 'PRODUIT' AND e.compte_credit = c.numero THEN e.montant
          WHEN c.type_compte = 'CHARGE' AND e.compte_debit = c.numero THEN e.montant
          ELSE 0 
        END), 0) as montant
      FROM comptes c
      LEFT JOIN ecritures e ON (
        (c.type_compte = 'PRODUIT' AND e.compte_credit = c.numero) OR
        (c.type_compte = 'CHARGE' AND e.compte_debit = c.numero)
      )
      WHERE c.type_compte IN ('PRODUIT', 'CHARGE')
        AND (e.date IS NULL OR (e.date >= ? AND e.date <= ?))
      GROUP BY c.numero, c.libelle, c.type_compte
      HAVING montant > 0 OR c.numero LIKE '6%' OR c.numero LIKE '7%'
      ORDER BY c.numero
    `;

    const result = await db.select<
      {
        numero: string;
        libelle: string;
        type_compte: string;
        montant: number;
      }[]
    >(query, [periode.debut, periode.fin]);

    // Séparer les produits et les charges
    const produits: ResultatLine[] = [];
    const charges: ResultatLine[] = [];

    // Ordre d'affichage personnalisé
    const ordreProduits: Record<string, number> = {
      "701": 10, // Ventes de marchandises
      "702": 20, // Ventes de produits finis
      "706": 30, // Prestations de services
      "75": 40, // Autres produits
      "76": 50, // Produits financiers
    };

    const ordreCharges: Record<string, number> = {
      "601": 10, // Achats de marchandises
      "602": 20, // Achats de matières premières
      "606": 30, // Achats non stockés
      "61": 40, // Services extérieurs
      "62": 45, // Autres services
      "63": 50, // Impôts et taxes
      "64": 60, // Charges de personnel
      "65": 70, // Autres charges
      "66": 80, // Charges financières
      "68": 90, // Dotations
    };

    for (const row of result) {
      if (row.type_compte === "PRODUIT" && row.montant > 0) {
        produits.push({
          compte_numero: row.numero,
          compte_libelle: row.libelle,
          montant: row.montant,
          type: "PRODUIT",
          ordre: ordreProduits[row.numero.substring(0, 3)] || 100,
        });
      } else if (row.type_compte === "CHARGE" && row.montant > 0) {
        charges.push({
          compte_numero: row.numero,
          compte_libelle: row.libelle,
          montant: row.montant,
          type: "CHARGE",
          ordre: ordreCharges[row.numero.substring(0, 3)] || 100,
        });
      }
    }

    // Ajouter les comptes qui n'ont pas de mouvement mais qui doivent apparaître
    const comptesFixes = [
      // Produits sans mouvement
      {
        numero: "701",
        libelle: "Ventes de marchandises",
        type: "PRODUIT",
        ordre: 10,
      },
      {
        numero: "702",
        libelle: "Ventes de produits finis",
        type: "PRODUIT",
        ordre: 20,
      },
      {
        numero: "706",
        libelle: "Prestations de services",
        type: "PRODUIT",
        ordre: 30,
      },
      // Charges sans mouvement
      {
        numero: "601",
        libelle: "Achats de marchandises",
        type: "CHARGE",
        ordre: 10,
      },
      {
        numero: "602",
        libelle: "Achats de matières premières",
        type: "CHARGE",
        ordre: 20,
      },
      {
        numero: "606",
        libelle: "Achats non stockés",
        type: "CHARGE",
        ordre: 30,
      },
      {
        numero: "61",
        libelle: "Services extérieurs",
        type: "CHARGE",
        ordre: 40,
      },
      {
        numero: "64",
        libelle: "Charges de personnel",
        type: "CHARGE",
        ordre: 60,
      },
    ];

    for (const fixe of comptesFixes) {
      const existe = (fixe.type === "PRODUIT" ? produits : charges).some(
        (l) => l.compte_numero === fixe.numero,
      );

      if (!existe) {
        if (fixe.type === "PRODUIT") {
          produits.push({
            compte_numero: fixe.numero,
            compte_libelle: fixe.libelle,
            montant: 0,
            type: "PRODUIT",
            ordre: fixe.ordre,
          });
        } else {
          charges.push({
            compte_numero: fixe.numero,
            compte_libelle: fixe.libelle,
            montant: 0,
            type: "CHARGE",
            ordre: fixe.ordre,
          });
        }
      }
    }

    // Trier par ordre
    produits.sort((a, b) => a.ordre - b.ordre);
    charges.sort((a, b) => a.ordre - b.ordre);

    // Calculer les totaux
    const totalProduits = produits.reduce((sum, p) => sum + p.montant, 0);
    const totalCharges = charges.reduce((sum, c) => sum + c.montant, 0);
    const resultat = totalProduits - totalCharges;

    return {
      produits: {
        titre: "PRODUITS",
        total: totalProduits,
        lignes: produits,
      },
      charges: {
        titre: "CHARGES",
        total: totalCharges,
        lignes: charges,
      },
      resultat: {
        montant: Math.abs(resultat),
        type: resultat >= 0 ? "BENEFICE" : "PERTE",
        taux_marge: totalProduits > 0 ? (resultat / totalProduits) * 100 : 0,
      },
      periode,
    };
  } catch (error) {
    console.error("Erreur getCompteResultat:", error);
    throw error;
  }
}

/**
 * Calcule le résultat pour plusieurs périodes (comparaison)
 */
export async function getResultatComparatif(
  periode1: ResultatFilters,
  periode2: ResultatFilters,
): Promise<{
  periode1: CompteResultatData;
  periode2: CompteResultatData;
  evolution: {
    montant: number;
    pourcentage: number;
  };
}> {
  try {
    const [res1, res2] = await Promise.all([
      getCompteResultat(periode1),
      getCompteResultat(periode2),
    ]);

    const evolutionMontant = res2.resultat.montant - res1.resultat.montant;
    const evolutionPourcentage =
      res1.resultat.montant !== 0
        ? (evolutionMontant / res1.resultat.montant) * 100
        : 0;

    return {
      periode1: res1,
      periode2: res2,
      evolution: {
        montant: evolutionMontant,
        pourcentage: evolutionPourcentage,
      },
    };
  } catch (error) {
    console.error("Erreur getResultatComparatif:", error);
    throw error;
  }
}

/**
 * Exporte le compte de résultat au format CSV
 */
export async function exportResultatToCSV(
  filters: ResultatFilters,
): Promise<string> {
  try {
    const data = await getCompteResultat(filters);

    const headers = ["Compte", "Libellé", "Montant"];
    const rows: string[] = [];

    // Produits
    rows.push("PRODUITS");
    for (const ligne of data.produits.lignes) {
      rows.push(
        [
          ligne.compte_numero,
          `"${ligne.compte_libelle.replace(/"/g, '""')}"`,
          ligne.montant.toString(),
        ].join(","),
      );
    }
    rows.push(`"TOTAL PRODUITS",,${data.produits.total}`);
    rows.push("");

    // Charges
    rows.push("CHARGES");
    for (const ligne of data.charges.lignes) {
      rows.push(
        [
          ligne.compte_numero,
          `"${ligne.compte_libelle.replace(/"/g, '""')}"`,
          ligne.montant.toString(),
        ].join(","),
      );
    }
    rows.push(`"TOTAL CHARGES",,${data.charges.total}`);
    rows.push("");

    // Résultat
    rows.push(`"RÉSULTAT (${data.resultat.type})",,${data.resultat.montant}`);
    if (data.resultat.taux_marge !== undefined) {
      rows.push(`"Taux de marge",,${data.resultat.taux_marge.toFixed(2)}%`);
    }

    return [headers.join(","), ...rows].join("\n");
  } catch (error) {
    console.error("Erreur exportResultatToCSV:", error);
    throw error;
  }
}
