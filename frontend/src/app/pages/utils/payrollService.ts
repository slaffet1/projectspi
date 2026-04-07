// utils/payrollService.ts

export interface PayrollResult {
    salaireBrut: number;
    retenueCnss: number;
    salaireBrutImposable: number;
    retenueIrpp: number;
    retenueCss: number;
    salaireNet: number;
}

export function calculatePaie(brutMensuel: number, isChefDeFamille: boolean, nbrEnfants: number): PayrollResult {
    // 1. CNSS (Taux employé 2026 : 9.68%)
    const cnssMensuel = brutMensuel * 0.0968;
    const brutImposableMensuel = brutMensuel - cnssMensuel;
    
    // 2. Base imposable annuelle
    const brutImposableAnnuel = brutImposableMensuel * 12;
    let fraisPro = Math.min(brutImposableAnnuel * 0.10, 2000); // Plafond 2000 TND
    
    const abattementChef = isChefDeFamille ? 300 : 0;
    const abattementEnfants = nbrEnfants * 100; // 100 TND par enfant
    
    let revenuNetImposable = brutImposableAnnuel - fraisPro - abattementChef - abattementEnfants;
    if (revenuNetImposable < 0) revenuNetImposable = 0;
    
    // 3. IRPP Annuel (Barème LF 2026)
    let irppAnnuel = 0;
    const tranches = [
        { min: 0, max: 5000, taux: 0 },
        { min: 5000, max: 10000, taux: 0.15 },
        { min: 10000, max: 20000, taux: 0.25 },
        { min: 20000, max: 30000, taux: 0.30 },
        { min: 30000, max: 40000, taux: 0.33 },
        { min: 40000, max: 50000, taux: 0.36 },
        { min: 50000, max: 70000, taux: 0.38 },
        { min: 70000, max: Infinity, taux: 0.40 }
    ];
    
    for (const tranche of tranches) {
        if (revenuNetImposable > tranche.min) {
            const montantDansTranche = Math.min(revenuNetImposable, tranche.max) - tranche.min;
            irppAnnuel += montantDansTranche * tranche.taux;
        }
    }
    
    // 4. CSS Annuel (0.5% du revenu net imposable)
    const cssAnnuel = revenuNetImposable * 0.005;
    
    // 5. Résultats mensuels
    const irppMensuel = irppAnnuel / 12;
    const cssMensuel = cssAnnuel / 12;
    const netMensuel = brutImposableMensuel - irppMensuel - cssMensuel;
    
    return {
        salaireBrut: Number(brutMensuel.toFixed(3)),
        retenueCnss: Number(cnssMensuel.toFixed(3)),
        salaireBrutImposable: Number(brutImposableMensuel.toFixed(3)),
        retenueIrpp: Number(irppMensuel.toFixed(3)),
        retenueCss: Number(cssMensuel.toFixed(3)),
        salaireNet: Number(netMensuel.toFixed(3))
    };
}

// Recherche dichotomique pour trouver le Brut à partir du Net (Reverse calculation)
export function calculateBrutFromNet(targetNet: number, isChefDeFamille: boolean, nbrEnfants: number): PayrollResult {
    let low = targetNet;
    let high = targetNet * 3; 
    let bestBrut = low;
    
    // 50 itérations suffisent largement pour une précision au millième de dinar
    for (let i = 0; i < 50; i++) {
        const mid = (low + high) / 2;
        const result = calculatePaie(mid, isChefDeFamille, nbrEnfants);
        if (result.salaireNet < targetNet) {
            low = mid;
        } else {
            high = mid;
            bestBrut = mid;
        }
    }
    return calculatePaie(bestBrut, isChefDeFamille, nbrEnfants);
}