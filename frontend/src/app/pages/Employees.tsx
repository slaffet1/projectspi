import React, { useState, useEffect } from "react";
import { Plus, Users, Download, FileText, Calculator, History, CheckCircle } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card, CardContent } from "@/app/components/ui/card";
import { useBusiness } from "@/app/context/BusinessContext"; // Votre contexte
import { employeeService } from "@/app/services/employeeService";
import { calculatePaie, calculateBrutFromNet, PayrollResult } from "./utils/payrollService"; // Le moteur de calcul créé précédemment
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";



export default function Employees() {
    const { activeBusiness } = useBusiness();
    const businessId = activeBusiness?.id;

    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals state
    const [showAddModal, setShowAddModal] = useState(false);
    const [employeeForPayslip, setEmployeeForPayslip] = useState<any | null>(null);
    const [employeeForHistory, setEmployeeForHistory] = useState<any | null>(null);
    
    // Données des modals
    const [payslipsHistory, setPayslipsHistory] = useState<any[]>([]);
    const [simulation, setSimulation] = useState<PayrollResult | null>(null);
    const [isSavingPayslip, setIsSavingPayslip] = useState(false);

    // Formulaire Nouvel Employé
    const [formData, setFormData] = useState({
        firstName: "", lastName: "",
        isHeadOfFamily: false, childrenCount: 0,
        baseSalary: "", salaryType: "BRUT"
    });

    useEffect(() => {
        if (businessId) fetchEmployees();
    }, [businessId]);

    const fetchEmployees = async () => {
        try {
            const res = await employeeService.getEmployees(businessId!);
            setEmployees(res.data.data); // NestJS renvoie { success: true, data: [...] }
        } catch (err) {
            console.error("Erreur chargement employés", err);
        } finally {
            setLoading(false);
        }
    };

    // ─── ACTIONS ────────────────────────────────────────────────────────

    const handleCreateEmployee = async () => {
        if (!formData.firstName || !formData.lastName || !formData.baseSalary) return;
        try {
            await employeeService.createEmployee({
                ...formData,
                businessId,
                baseSalary: Number(formData.baseSalary)
            });
            setShowAddModal(false);
            setFormData({ firstName: "", lastName: "", isHeadOfFamily: false, childrenCount: 0, baseSalary: "", salaryType: "BRUT" });
            fetchEmployees();
        } catch (err) {
            console.error(err);
            alert("Erreur lors de la création");
        }
    };

    const openGeneratePayslip = (employee: any) => {
        // Auto-calcul basé sur les données de l'employé
        let result;
        if (employee.salaryType === "BRUT") {
            result = calculatePaie(employee.baseSalary, employee.isHeadOfFamily, employee.childrenCount);
        } else {
            result = calculateBrutFromNet(employee.baseSalary, employee.isHeadOfFamily, employee.childrenCount);
        }
        setSimulation(result);
        setEmployeeForPayslip(employee);
    };

    const handleSavePayslip = async () => {
        if (!simulation || !employeeForPayslip) return;
        setIsSavingPayslip(true);
        try {
            const currentMonth = new Date().getMonth() + 1;
            const currentYear = new Date().getFullYear();

            await employeeService.savePayslip({
                employeeId: employeeForPayslip.id,
                month: currentMonth,
                year: currentYear,
                ...simulation
            });
            alert("Fiche de paie sauvegardée avec succès !");
            setEmployeeForPayslip(null);
            fetchEmployees(); // Rafraîchir pour mettre à jour le compteur
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.message || "Erreur lors de la sauvegarde.");
        } finally {
            setIsSavingPayslip(false);
        }
    };

    const openHistory = async (employee: any) => {
        try {
            const res = await employeeService.getPayslips(employee.id);
            setPayslipsHistory(res.data.data);
            setEmployeeForHistory(employee);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDownloadPDF = (data: PayrollResult, employee: any, monthStr: string) => {
        const doc = new jsPDF();
        const nomComplet = `${employee.firstName} ${employee.lastName}`;
        
        doc.setFontSize(20);
        doc.text("Fiche de Paie", 14, 22);
        
        doc.setFontSize(12);
        doc.text(`Employé : ${nomComplet}`, 14, 35);
        doc.text(`Période : ${monthStr}`, 14, 42);
        doc.text(`Situation : ${employee.isHeadOfFamily ? 'Chef de famille' : 'Célibataire'} - ${employee.childrenCount} enfant(s)`, 14, 49);

        autoTable(doc, {
            startY: 60,
            head: [['Désignation', 'Gains (TND)', 'Retenues (TND)']],
            body: [
                ['Salaire de base (Brut)', data.salaireBrut.toFixed(3), ''],
                ['Retenue CNSS (9.68%)', '', data.retenueCnss.toFixed(3)],
                ['Salaire Brut Imposable', data.salaireBrutImposable.toFixed(3), ''],
                ['Retenue à la source (IRPP)', '', data.retenueIrpp.toFixed(3)],
                ['Contribution Solidarité (CSS)', '', data.retenueCss.toFixed(3)],
            ],
            foot: [['SALAIRE NET À PAYER', data.salaireNet.toFixed(3), '']],
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185] },
            footStyles: { fillColor: [46, 204, 113], textColor: 255, fontStyle: 'bold' }
        });

        doc.save(`Fiche_Paie_${nomComplet.replace(' ', '_')}_${monthStr.replace(' ', '_')}.pdf`);
    };

    if (loading) return <div className="p-6">Chargement...</div>;

    // ─── RENDU ────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-semibold text-foreground">Employés & Paie</h1>
                    <p className="text-muted-foreground mt-1">Gestion du personnel et fiches de paie (Barème LF 2026)</p>
                </div>
                <Button onClick={() => setShowAddModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvel Employé
                </Button>
            </div>

            {/* TABLEAU DES EMPLOYÉS */}
            <Card className="border-border shadow-sm">
                <CardContent className="pt-6">
                    {employees.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p>Aucun employé enregistré</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-muted-foreground">
                                        <th className="py-3 px-4 font-medium">Nom complet</th>
                                        <th className="py-3 px-4 font-medium">Situation</th>
                                        <th className="py-3 px-4 font-medium">Enfants</th>
                                        <th className="py-3 px-4 font-medium">Base contractuelle</th>
                                        <th className="py-3 px-4 font-medium">Historique</th>
                                        <th className="py-3 px-4 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {employees.map(emp => (
                                        <tr key={emp.id} className="border-b hover:bg-muted/50">
                                            <td className="py-3 px-4 font-medium">{emp.firstName} {emp.lastName}</td>
                                            <td className="py-3 px-4">{emp.isHeadOfFamily ? "Chef de famille" : "Célibataire"}</td>
                                            <td className="py-3 px-4">{emp.childrenCount}</td>
                                            <td className="py-3 px-4 font-semibold text-primary">
                                                {Number(emp.baseSalary).toFixed(3)} TND <span className="text-xs text-gray-500 font-normal">({emp.salaryType})</span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="bg-gray-100 px-2 py-1 rounded-md text-xs font-medium">
                                                    {emp._count?.payslips || 0} fiches
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 flex justify-end gap-2">
                                                <Button size="sm" variant="outline" onClick={() => openGeneratePayslip(emp)} className="text-blue-600 border-blue-200 hover:bg-blue-50">
                                                    <Calculator className="h-4 w-4 mr-1" /> Générer Paie
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => openHistory(emp)}>
                                                    <History className="h-4 w-4 text-gray-600" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* MODAL 1 : AJOUTER UN EMPLOYÉ */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-lg p-6 shadow-xl">
                        <h2 className="text-xl font-bold mb-4 border-b pb-3">Nouvel Employé</h2>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><Label>Prénom *</Label><Input autoFocus value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} /></div>
                                <div><Label>Nom *</Label><Input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} /></div>
                            </div>
                            
                            <div className="flex gap-4 items-end">
                                <div className="flex-1 flex items-center gap-2 mb-2">
                                    <input type="checkbox" id="chef" checked={formData.isHeadOfFamily} onChange={e => setFormData({...formData, isHeadOfFamily: e.target.checked})} className="w-4 h-4" />
                                    <Label htmlFor="chef" className="cursor-pointer">Chef de famille</Label>
                                </div>
                                <div className="flex-1">
                                    <Label>Nombre d'enfants</Label>
                                    <Input type="number" min="0" value={formData.childrenCount} onChange={e => setFormData({...formData, childrenCount: Number(e.target.value)})} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg mt-2">
                                <div>
                                    <Label>Type de contrat</Label>
                                    <select className="w-full mt-1 border rounded-md px-3 py-2" value={formData.salaryType} onChange={e => setFormData({...formData, salaryType: e.target.value})}>
                                        <option value="BRUT">Salaire Brut</option>
                                        <option value="NET">Salaire Net</option>
                                    </select>
                                </div>
                                <div>
                                    <Label>Montant convenu (TND) *</Label>
                                    <Input type="number" min="0" value={formData.baseSalary} onChange={e => setFormData({...formData, baseSalary: e.target.value})} />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6 border-t pt-4">
                            <Button variant="ghost" onClick={() => setShowAddModal(false)}>Annuler</Button>
                            <Button onClick={handleCreateEmployee} disabled={!formData.firstName || !formData.lastName || !formData.baseSalary}>
                                Enregistrer
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2 : GÉNÉRER FICHE DE PAIE */}
            {employeeForPayslip && simulation && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col">
                        <div className="bg-primary p-4 text-white flex justify-between items-center">
                            <div>
                                <h2 className="font-bold text-lg">Simulation Paie : {employeeForPayslip.firstName} {employeeForPayslip.lastName}</h2>
                                <p className="text-primary-foreground/80 text-sm">Mois actuel : {new Date().toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}</p>
                            </div>
                            <button onClick={() => setEmployeeForPayslip(null)} className="text-white hover:text-gray-200">✕</button>
                        </div>
                        
                        <div className="p-6 space-y-3 flex-1 bg-gray-50">
                            <div className="flex justify-between py-2 border-b border-gray-200"><span className="text-gray-600">Salaire Brut</span><span className="font-medium">{simulation.salaireBrut.toFixed(3)} TND</span></div>
                            <div className="flex justify-between py-2 border-b border-gray-200"><span className="text-gray-600">Retenue CNSS (9.68%)</span><span className="text-red-500 font-medium">-{simulation.retenueCnss.toFixed(3)} TND</span></div>
                            <div className="flex justify-between py-2 border-b border-gray-200"><span className="text-gray-600">Salaire Brut Imposable</span><span className="font-medium">{simulation.salaireBrutImposable.toFixed(3)} TND</span></div>
                            <div className="flex justify-between py-2 border-b border-gray-200"><span className="text-gray-600">IRPP (Barème 2026)</span><span className="text-red-500 font-medium">-{simulation.retenueIrpp.toFixed(3)} TND</span></div>
                            <div className="flex justify-between py-2 border-b border-gray-200"><span className="text-gray-600">CSS (0.5%)</span><span className="text-red-500 font-medium">-{simulation.retenueCss.toFixed(3)} TND</span></div>
                            
                            <div className="flex justify-between py-4 mt-4 bg-green-100 border border-green-200 px-4 rounded-lg">
                                <span className="font-bold text-green-800">SALAIRE NET À PAYER</span>
                                <span className="font-bold text-green-800 text-xl">{simulation.salaireNet.toFixed(3)} TND</span>
                            </div>
                        </div>

                        <div className="p-4 border-t bg-white flex justify-between items-center gap-2">
                            <Button variant="outline" onClick={() => handleDownloadPDF(simulation, employeeForPayslip, new Date().toLocaleString('fr-FR', { month: 'long', year: 'numeric' }))}>
                                <Download className="h-4 w-4 mr-2" /> Télécharger PDF
                            </Button>
                            <Button onClick={handleSavePayslip} disabled={isSavingPayslip} className="bg-green-600 hover:bg-green-700 text-white">
                                {isSavingPayslip ? "Sauvegarde..." : "Enregistrer ce mois-ci"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 3 : HISTORIQUE DES PAIES */}
            {employeeForHistory && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-2xl p-6 shadow-xl max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4 border-b pb-3">
                            <h2 className="text-xl font-bold">Historique - {employeeForHistory.firstName} {employeeForHistory.lastName}</h2>
                            <button onClick={() => setEmployeeForHistory(null)} className="text-gray-500 hover:bg-gray-100 p-2 rounded-lg">✕</button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto pr-2">
                            {payslipsHistory.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">Aucune fiche de paie enregistrée.</p>
                            ) : (
                                <div className="space-y-3">
                                    {payslipsHistory.map((slip, idx) => {
                                        // Reconstruction de la date pour l'affichage
                                        const dateStr = new Date(slip.year, slip.month - 1).toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
                                        return (
                                            <div key={idx} className="border rounded-lg p-4 flex justify-between items-center hover:bg-gray-50">
                                                <div>
                                                    <p className="font-semibold capitalize text-lg">{dateStr}</p>
                                                    <p className="text-sm text-gray-500">Net payé : <span className="font-medium text-green-600">{Number(slip.salaireNet).toFixed(3)} TND</span></p>
                                                </div>
                                                <Button size="sm" variant="outline" onClick={() => handleDownloadPDF(slip, employeeForHistory, dateStr)}>
                                                    <Download className="h-4 w-4 mr-2" /> Re-télécharger
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}