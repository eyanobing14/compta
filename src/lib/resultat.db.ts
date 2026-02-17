// lib/resultat.db.ts (mise à jour avec analyse par niveau)
import { getDb } from "./db";
import {
  CompteResultatData,
  ResultatLine,
  ResultatFilters,
  PeriodeType,
  ResultatAnalytique,
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
      "77": 60, // Produits exceptionnels
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
      "67": 85, // Charges exceptionnelles
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
          niveau: getNiveauCompte(row.numero, "PRODUIT"),
        });
      } else if (row.type_compte === "CHARGE" && row.montant > 0) {
        charges.push({
          compte_numero: row.numero,
          compte_libelle: row.libelle,
          montant: row.montant,
          type: "CHARGE",
          ordre: ordreCharges[row.numero.substring(0, 3)] || 100,
          niveau: getNiveauCompte(row.numero, "CHARGE"),
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
        niveau: "exploitation",
      },
      {
        numero: "702",
        libelle: "Ventes de produits finis",
        type: "PRODUIT",
        ordre: 20,
        niveau: "exploitation",
      },
      {
        numero: "706",
        libelle: "Prestations de services",
        type: "PRODUIT",
        ordre: 30,
        niveau: "exploitation",
      },
      {
        numero: "76",
        libelle: "Produits financiers",
        type: "PRODUIT",
        ordre: 50,
        niveau: "financier",
      },
      {
        numero: "77",
        libelle: "Produits exceptionnels",
        type: "PRODUIT",
        ordre: 60,
        niveau: "exceptionnel",
      },
      // Charges sans mouvement
      {
        numero: "601",
        libelle: "Achats de marchandises",
        type: "CHARGE",
        ordre: 10,
        niveau: "exploitation",
      },
      {
        numero: "602",
        libelle: "Achats de matières premières",
        type: "CHARGE",
        ordre: 20,
        niveau: "exploitation",
      },
      {
        numero: "606",
        libelle: "Achats non stockés",
        type: "CHARGE",
        ordre: 30,
        niveau: "exploitation",
      },
      {
        numero: "61",
        libelle: "Services extérieurs",
        type: "CHARGE",
        ordre: 40,
        niveau: "exploitation",
      },
      {
        numero: "64",
        libelle: "Charges de personnel",
        type: "CHARGE",
        ordre: 60,
        niveau: "exploitation",
      },
      {
        numero: "66",
        libelle: "Charges financières",
        type: "CHARGE",
        ordre: 80,
        niveau: "financier",
      },
      {
        numero: "67",
        libelle: "Charges exceptionnelles",
        type: "CHARGE",
        ordre: 85,
        niveau: "exceptionnel",
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
            niveau: fixe.niveau as any,
          });
        } else {
          charges.push({
            compte_numero: fixe.numero,
            compte_libelle: fixe.libelle,
            montant: 0,
            type: "CHARGE",
            ordre: fixe.ordre,
            niveau: fixe.niveau as any,
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
        taux_marge:
          totalProduits > 0 ? (Math.abs(resultat) / totalProduits) * 100 : 0,
      },
      periode,
    };
  } catch (error) {
    console.error("Erreur getCompteResultat:", error);
    throw error;
  }
}

/**
 * Détermine le niveau d'un compte (exploitation, financier, exceptionnel)
 */
function getNiveauCompte(
  numero: string,
  type: "PRODUIT" | "CHARGE",
): "exploitation" | "financier" | "exceptionnel" {
  const debut = numero.substring(0, 2);

  if (type === "PRODUIT") {
    if (debut === "76") return "financier";
    if (debut === "77") return "exceptionnel";
    return "exploitation";
  } else {
    if (debut === "66") return "financier";
    if (debut === "67") return "exceptionnel";
    return "exploitation";
  }
}

/**
 * Calcule l'analyse détaillée du résultat par niveau
 */
export async function getResultatAnalytique(
  filters: ResultatFilters,
): Promise<ResultatAnalytique> {
  try {
    const data = await getCompteResultat(filters);

    // Calcul par niveau
    let produitsExploitation = 0;
    let produitsFinanciers = 0;
    let produitsExceptionnels = 0;
    let chargesExploitation = 0;
    let chargesFinancieres = 0;
    let chargesExceptionnelles = 0;

    for (const ligne of data.produits.lignes) {
      if (ligne.niveau === "exploitation")
        produitsExploitation += ligne.montant;
      else if (ligne.niveau === "financier")
        produitsFinanciers += ligne.montant;
      else if (ligne.niveau === "exceptionnel")
        produitsExceptionnels += ligne.montant;
    }

    for (const ligne of data.charges.lignes) {
      if (ligne.niveau === "exploitation") chargesExploitation += ligne.montant;
      else if (ligne.niveau === "financier")
        chargesFinancieres += ligne.montant;
      else if (ligne.niveau === "exceptionnel")
        chargesExceptionnelles += ligne.montant;
    }

    const resultatExploitation = produitsExploitation - chargesExploitation;
    const resultatFinancier = produitsFinanciers - chargesFinancieres;
    const resultatExceptionnel = produitsExceptionnels - chargesExceptionnelles;
    const totalProduits = data.produits.total;

    return {
      resultat_exploitation: resultatExploitation,
      resultat_financier: resultatFinancier,
      resultat_exceptionnel: resultatExceptionnel,
      produits_exploitation: produitsExploitation,
      charges_exploitation: chargesExploitation,
      produits_financiers: produitsFinanciers,
      charges_financieres: chargesFinancieres,
      produits_exceptionnels: produitsExceptionnels,
      charges_exceptionnelles: chargesExceptionnelles,
      ratio_exploitation:
        totalProduits > 0 ? (resultatExploitation / totalProduits) * 100 : 0,
      ratio_financier:
        totalProduits > 0 ? (resultatFinancier / totalProduits) * 100 : 0,
      ratio_exceptionnel:
        totalProduits > 0 ? (resultatExceptionnel / totalProduits) * 100 : 0,
    };
  } catch (error) {
    console.error("Erreur getResultatAnalytique:", error);
    throw error;
  }
}
