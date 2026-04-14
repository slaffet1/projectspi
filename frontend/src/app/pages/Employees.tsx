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

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",

        isHeadOfFamily: false,
        childrenCount: 0,
        baseSalary: 0,
        salaryType: "BRUT",

        age: 0,
        gender: "Male",
        maritalStatus: "Single",
        department: "",
        jobRole: "",
        jobLevel: 1,

        yearsAtCompany: 0,
        yearsInCurrentRole: 0,
        yearsSinceLastPromotion: 0,

        jobSatisfaction: 3,
        workLifeBalance: 3,
        performanceRating: 3,
        jobInvolvement: 3,

        overtime: "No",   // 🔥 FIXED
        projectCount: 0,
        averageHoursPerWeek: 40,
        absenteeism: 0,
        distanceFromHome: 5,
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
                baseSalary: Number(formData.baseSalary),
                age: Number(formData.age),
            });

            setShowAddModal(false);

            setFormData({
                firstName: "",
                lastName: "",
                isHeadOfFamily: false,
                childrenCount: 0,
                baseSalary: 0,
                salaryType: "BRUT",

                age: 0,
                gender: "Male",
                maritalStatus: "Single",
                department: "",
                jobRole: "",
                jobLevel: 1,
                yearsAtCompany: 0,
                yearsInCurrentRole: 0,
                yearsSinceLastPromotion: 0,
                jobSatisfaction: 3,
                workLifeBalance: 3,
                performanceRating: 3,
                jobInvolvement: 3,
                overtime: "No",
                projectCount: 0,
                averageHoursPerWeek: 40,
                absenteeism: 0,
                distanceFromHome: 5,
            });

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
                                        <th className="py-3 px-4 font-medium">Attrition</th>
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
                                                {emp.attritionRisk ? (
                                                    <div className="flex flex-col gap-1">
                                                        <span
                                                            className={`px-2 py-1 rounded-md text-xs font-semibold w-fit ${emp.attritionRisk === "HIGH_RISK"
                                                                ? "bg-red-100 text-red-600"
                                                                : "bg-green-100 text-green-600"
                                                                }`}
                                                        >
                                                            {emp.attritionRisk}
                                                        </span>

                                                        {emp.attritionProbability !== null && emp.attritionProbability !== undefined && (
                                                            <span className="text-xs text-gray-500">
                                                                {(emp.attritionProbability * 100).toFixed(1)}%
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">Not predicted</span>
                                                )}
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
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">

                        {/* HEADER */}
                        <div className="px-6 py-4 border-b bg-gray-50 flex items-start justify-between">
                            <div>
                                <h2 className="text-xl font-bold">Nouvel Employé</h2>
                                <p className="text-sm text-gray-500">Ajoutez un nouvel employé et ses données RH</p>
                            </div>
                            <div className="flex gap-2 flex-wrap justify-end">
                                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">* Requis</span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">● Modèle ML</span>
                            </div>
                        </div>

                        {/* BODY */}
                        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">

                            {/* ── 1. IDENTITÉ ────────────────────────────────────── */}
                            <section>
                                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Identité</p>
                                <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Prénom *</Label>
                                        <Input autoFocus value={formData.firstName}
                                            onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
                                    </div>
                                    <div>
                                        <Label>Nom *</Label>
                                        <Input value={formData.lastName}
                                            onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
                                    </div>
                                    <div>
                                        <Label>Âge ●</Label>
                                        <Input type="number" value={formData.age}
                                            onChange={e => setFormData({ ...formData, age: Number(e.target.value) })} />
                                    </div>
                                    <div>
                                        <Label>Genre ●</Label>
                                        <select className="w-full mt-1 border rounded-md px-3 py-2"
                                            value={formData.gender}
                                            onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label>Statut marital ●</Label>
                                        <select className="w-full mt-1 border rounded-md px-3 py-2"
                                            value={formData.maritalStatus}
                                            onChange={e => setFormData({ ...formData, maritalStatus: e.target.value })}>
                                            <option value="Single">Single</option>
                                            <option value="Married">Married</option>
                                            <option value="Divorced">Divorced</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <div>
                                            <Label>Nombre d'enfants ●</Label>
                                            <Input type="number" min="0" value={formData.childrenCount}
                                                onChange={e => setFormData({ ...formData, childrenCount: Number(e.target.value) })} />
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <input type="checkbox" className="w-4 h-4"
                                                checked={formData.isHeadOfFamily}
                                                onChange={e => setFormData({ ...formData, isHeadOfFamily: e.target.checked })} />
                                            <Label>Chef de famille</Label>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* ── 2. POSTE & CONTRAT ──────────────────────────────── */}
                            <section>
                                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Poste & Contrat</p>
                                <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Département ●</Label>
                                        <Input value={formData.department}
                                            onChange={e => setFormData({ ...formData, department: e.target.value })} />
                                    </div>
                                    <div>
                                        <Label>Poste ●</Label>
                                        <Input value={formData.jobRole}
                                            onChange={e => setFormData({ ...formData, jobRole: e.target.value })} />
                                    </div>
                                    <div>
                                        <Label>Niveau de poste ●</Label>
                                        <Input type="number" value={formData.jobLevel}
                                            onChange={e => setFormData({ ...formData, jobLevel: Number(e.target.value) })} />
                                    </div>
                                    <div>
                                        <Label>Heures sup. ●</Label>
                                        <select className="w-full mt-1 border rounded-md px-3 py-2"
                                            value={formData.overtime}
                                            onChange={e => setFormData({ ...formData, overtime: e.target.value })}>
                                            <option value="No">No</option>
                                            <option value="Yes">Yes</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label>Heures / semaine ●</Label>
                                        <Input type="number" value={formData.averageHoursPerWeek}
                                            onChange={e => setFormData({ ...formData, averageHoursPerWeek: Number(e.target.value) })} />
                                    </div>
                                    <div>
                                        <Label>Distance domicile (km) ●</Label>
                                        <Input type="number" value={formData.distanceFromHome}
                                            onChange={e => setFormData({ ...formData, distanceFromHome: Number(e.target.value) })} />
                                    </div>
                                </div>
                            </section>

                            {/* ── 3. RÉMUNÉRATION ─────────────────────────────────── */}
                            <section>
                                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Rémunération</p>
                                <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Type de contrat *</Label>
                                        <select className="w-full mt-1 border rounded-md px-3 py-2"
                                            value={formData.salaryType}
                                            onChange={e => setFormData({ ...formData, salaryType: e.target.value })}>
                                            <option value="BRUT">Salaire Brut</option>
                                            <option value="NET">Salaire Net</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label>Salaire (TND) *</Label>
                                        <Input type="number" value={formData.baseSalary}
                                            onChange={e => setFormData({ ...formData, baseSalary: Number(e.target.value) })} />
                                    </div>
                                </div>
                            </section>

                            {/* ── 4. ANCIENNETÉ ───────────────────────────────────── */}
                            <section>
                                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Ancienneté ●</p>
                                <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-3 gap-4">
                                    <div>
                                        <Label>Années dans l'entreprise</Label>
                                        <Input type="number" value={formData.yearsAtCompany}
                                            onChange={e => setFormData({ ...formData, yearsAtCompany: Number(e.target.value) })} />
                                    </div>
                                    <div>
                                        <Label>Années dans le rôle actuel</Label>
                                        <Input type="number" value={formData.yearsInCurrentRole}
                                            onChange={e => setFormData({ ...formData, yearsInCurrentRole: Number(e.target.value) })} />
                                    </div>
                                    <div>
                                        <Label>Années depuis promotion</Label>
                                        <Input type="number" value={formData.yearsSinceLastPromotion}
                                            onChange={e => setFormData({ ...formData, yearsSinceLastPromotion: Number(e.target.value) })} />
                                    </div>
                                </div>
                            </section>

                            {/* ── 5. PERFORMANCE & ENGAGEMENT ─────────────────────── */}
                            <section>
                                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Performance & Engagement ●</p>
                                <div className="bg-gray-50 rounded-xl p-4 space-y-5">
                                    {[
                                        {
                                            key: "jobSatisfaction", label: "Satisfaction au travail",
                                            descriptions: ["", "Faible", "Moyen", "Satisfait", "Très satisfait"],
                                        },
                                        {
                                            key: "workLifeBalance", label: "Équilibre vie pro/perso",
                                            descriptions: ["", "Mauvais", "Correct", "Bon", "Excellent"],
                                        },
                                        {
                                            key: "performanceRating", label: "Performance",
                                            descriptions: ["", "Faible", "Correct", "Excellent", "Exceptionnel"],
                                        },
                                        {
                                            key: "jobInvolvement", label: "Implication dans le travail",
                                            descriptions: ["", "Faible", "Modérée", "Élevée", "Très élevée"],
                                        },
                                    ].map(({ key, label, descriptions }, idx) => (
                                        <div key={key}>
                                            {idx > 0 && <div className="border-t border-gray-200 mb-5" />}
                                            <div className="flex items-center justify-between mb-2">
                                                <Label>{label}</Label>
                                                <span className="text-xs text-gray-500">
                                                    {formData[key as keyof typeof formData]} — {descriptions[formData[key as keyof typeof formData] as number]}
                                                </span>
                                            </div>
                                            <input type="range" min={1} max={4} step={1}
                                                className="w-full"
                                                value={formData[key as keyof typeof formData] as number}
                                                onChange={e => setFormData({ ...formData, [key]: Number(e.target.value) })} />
                                            <div className="flex justify-between text-xs text-gray-400 mt-1">
                                                <span>1</span><span>2</span><span>3</span><span>4</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* ── 6. ACTIVITÉ ─────────────────────────────────────── */}
                            <section>
                                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Activité ●</p>
                                <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Projets en cours</Label>
                                        <Input type="number" value={formData.projectCount}
                                            onChange={e => setFormData({ ...formData, projectCount: Number(e.target.value) })} />
                                    </div>
                                    <div>
                                        <Label>Absentéisme (jours)</Label>
                                        <Input type="number" value={formData.absenteeism}
                                            onChange={e => setFormData({ ...formData, absenteeism: Number(e.target.value) })} />
                                    </div>
                                </div>
                            </section>

                        </div>

                        {/* FOOTER */}
                        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setShowAddModal(false)}>Annuler</Button>
                            <Button onClick={handleCreateEmployee}
                                disabled={!formData.firstName || !formData.lastName || !formData.baseSalary}>
                                Créer l'employé
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