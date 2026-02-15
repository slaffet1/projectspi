import { Link } from "react-router";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import {
  FileText,
  Users,
  TrendingUp,
  Shield,
  Clock,
  BarChart3,
  Receipt,
  Wallet,
  CheckCircle,
  ArrowRight,
  Menu,
  X,
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useState } from "react";

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-border z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-primary" />
              <span className="ml-2 font-semibold text-xl text-foreground">
                Business Management
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-muted-foreground hover:text-primary transition-colors">
                Fonctionnalités
              </a>
              <a href="#pricing" className="text-muted-foreground hover:text-primary transition-colors">
                Tarifs
              </a>
              <a href="#about" className="text-muted-foreground hover:text-primary transition-colors">
                À propos
              </a>
              <Link to="/app">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                  Se connecter
                </Button>
              </Link>
              <Link to="/app">
                <Button className="bg-primary hover:bg-accent">
                  Commencer gratuitement
                </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X /> : <Menu />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-white">
            <div className="px-4 pt-2 pb-4 space-y-2">
              <a
                href="#features"
                className="block px-3 py-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Fonctionnalités
              </a>
              <a
                href="#pricing"
                className="block px-3 py-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Tarifs
              </a>
              <a
                href="#about"
                className="block px-3 py-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                À propos
              </a>
              <Link to="/app" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-white">
                  Se connecter
                </Button>
              </Link>
              <Link to="/app" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-primary hover:bg-accent mt-2">
                  Commencer gratuitement
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block mb-4 px-4 py-2 bg-secondary/10 text-primary rounded-full">
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Solution 100% tunisienne
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                Gérez votre entreprise en toute simplicité
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mb-8 leading-relaxed">
                La plateforme complète de gestion financière pour PME tunisiennes.
                Facturation, clients, dépenses et rapports en un seul endroit.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/app">
                  <Button size="lg" className="bg-primary hover:bg-accent w-full sm:w-auto">
                    Essai gratuit 14 jours
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-primary text-primary hover:bg-primary hover:text-white">
                  Voir une démo
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Aucune carte de crédit requise • Configuration en 5 minutes
              </p>
            </div>
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-border">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1608222351212-18fe0ec7b13b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMGRhc2hib2FyZCUyMGFuYWx5dGljc3xlbnwxfHx8fDE3NzAxMjY1ODh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Business Management Dashboard"
                  className="w-full h-auto"
                />
              </div>
              {/* Floating stats cards */}
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-lg border border-border hidden sm:block">
                <div className="flex items-center gap-3">
                  <div className="bg-success/10 p-3 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Revenu mensuel</p>
                    <p className="font-semibold text-lg">+45%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-muted">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <p className="text-4xl font-bold text-primary mb-2">500+</p>
              <p className="text-muted-foreground">Entreprises actives</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-primary mb-2">50K+</p>
              <p className="text-muted-foreground">Factures générées</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-primary mb-2">98%</p>
              <p className="text-muted-foreground">Taux de satisfaction</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-primary mb-2">24/7</p>
              <p className="text-muted-foreground">Support disponible</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Une suite complète d'outils pour gérer efficacement votre entreprise
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="border border-border hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Facturation intelligente</h3>
                <p className="text-muted-foreground">
                  Créez et envoyez des factures professionnelles en quelques clics.
                  Calculs automatiques, TVA incluse.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="border border-border hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="bg-secondary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Gestion clients</h3>
                <p className="text-muted-foreground">
                  Centralisez toutes les informations de vos clients et suivez
                  l'historique des transactions.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="border border-border hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="bg-accent/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Receipt className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Suivi des dépenses</h3>
                <p className="text-muted-foreground">
                  Catégorisez et suivez toutes vos dépenses pour une meilleure
                  visibilité financière.
                </p>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="border border-border hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="bg-success/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-success" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Rapports détaillés</h3>
                <p className="text-muted-foreground">
                  Visualisez vos performances avec des graphiques et rapports
                  personnalisables.
                </p>
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card className="border border-border hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="bg-warning/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Gain de temps</h3>
                <p className="text-muted-foreground">
                  Automatisez les tâches répétitives et concentrez-vous sur
                  l'essentiel.
                </p>
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card className="border border-border hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="bg-destructive/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-destructive" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Sécurité maximale</h3>
                <p className="text-muted-foreground">
                  Vos données sont cryptées et sauvegardées automatiquement sur
                  des serveurs sécurisés.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              En 3 étapes simples, commencez à gérer votre entreprise
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold text-lg mb-2">Créez votre compte</h3>
              <p className="text-muted-foreground">
                Inscription gratuite en 2 minutes. Aucune carte de crédit requise
                pour l'essai.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-secondary text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold text-lg mb-2">Configurez vos données</h3>
              <p className="text-muted-foreground">
                Importez vos clients et personnalisez vos paramètres de
                facturation.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-accent text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold text-lg mb-2">Commencez à facturer</h3>
              <p className="text-muted-foreground">
                Créez votre première facture et envoyez-la à vos clients
                instantanément.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Tarifs transparents
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choisissez le plan qui correspond le mieux à vos besoins
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter Plan */}
            <Card className="border border-border hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <h3 className="font-semibold text-xl mb-2">Starter</h3>
                <p className="text-muted-foreground mb-6">Pour les auto-entrepreneurs</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-foreground">49 DT</span>
                  <span className="text-muted-foreground">/mois</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">Jusqu'à 50 factures/mois</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">10 clients maximum</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">Rapports basiques</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">Support par email</span>
                  </li>
                </ul>
                <Link to="/app">
                  <Button className="w-full bg-primary hover:bg-accent">
                    Commencer
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Professional Plan - Most Popular */}
            <Card className="border-2 border-primary shadow-xl relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                  Le plus populaire
                </span>
              </div>
              <CardContent className="p-8">
                <h3 className="font-semibold text-xl mb-2">Professional</h3>
                <p className="text-muted-foreground mb-6">Pour les PME en croissance</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-foreground">99 DT</span>
                  <span className="text-muted-foreground">/mois</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">Factures illimitées</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">Clients illimités</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">Rapports avancés</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">Gestion des dépenses</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">Support prioritaire</span>
                  </li>
                </ul>
                <Link to="/app">
                  <Button className="w-full bg-primary hover:bg-accent">
                    Commencer
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="border border-border hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <h3 className="font-semibold text-xl mb-2">Enterprise</h3>
                <p className="text-muted-foreground mb-6">Pour les grandes entreprises</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-foreground">199 DT</span>
                  <span className="text-muted-foreground">/mois</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">Tout du plan Professional</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">Utilisateurs multiples</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">API personnalisée</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">Support dédié 24/7</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">Formation personnalisée</span>
                  </li>
                </ul>
                <Link to="/app">
                  <Button className="w-full bg-primary hover:bg-accent">
                    Nous contacter
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Ce que disent nos clients
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Rejoignez des centaines d'entreprises qui nous font confiance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4 text-warning">
                  {[...Array(5)].map((_, i) => (
                    <span key={i}>★</span>
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "Une solution complète qui a transformé notre gestion
                  financière. Interface intuitive et support réactif."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-semibold">AS</span>
                  </div>
                  <div>
                    <p className="font-semibold">Ahmed Salah</p>
                    <p className="text-sm text-muted-foreground">CEO, TechStart</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4 text-warning">
                  {[...Array(5)].map((_, i) => (
                    <span key={i}>★</span>
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "Gain de temps énorme sur la facturation. Je recommande
                  vivement à toutes les PME tunisiennes."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                    <span className="text-secondary font-semibold">LB</span>
                  </div>
                  <div>
                    <p className="font-semibold">Leila Ben Ali</p>
                    <p className="text-sm text-muted-foreground">Directrice, ConsultPro</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4 text-warning">
                  {[...Array(5)].map((_, i) => (
                    <span key={i}>★</span>
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "Excellent rapport qualité-prix. La plateforme répond
                  parfaitement à nos besoins de gestion."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                    <span className="text-accent font-semibold">MK</span>
                  </div>
                  <div>
                    <p className="font-semibold">Mohamed Karim</p>
                    <p className="text-sm text-muted-foreground">Fondateur, DigitalHub</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Prêt à transformer votre gestion financière ?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Rejoignez des centaines d'entreprises tunisiennes qui utilisent déjà
            notre plateforme
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/app">
              <Button size="lg" className="bg-primary hover:bg-accent w-full sm:w-auto">
                Commencer gratuitement
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-primary text-primary hover:bg-primary hover:text-white">
              Planifier une démo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="about" className="bg-accent text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center mb-4">
                <BarChart3 className="h-8 w-8" />
                <span className="ml-2 font-semibold text-lg">
                  Business Management
                </span>
              </div>
              <p className="text-white/80 text-sm">
                La plateforme de gestion financière conçue pour les PME
                tunisiennes.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Produit</h4>
              <ul className="space-y-2 text-sm text-white/80">
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    Fonctionnalités
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-white transition-colors">
                    Tarifs
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Mises à jour
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Entreprise</h4>
              <ul className="space-y-2 text-sm text-white/80">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    À propos
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Carrières
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-white/80">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Centre d'aide
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Documentation
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/20 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-white/60">
              © 2026 Business Management Platform. Tous droits réservés.
            </p>
            <div className="flex gap-6 text-sm text-white/60">
              <a href="#" className="hover:text-white transition-colors">
                Confidentialité
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Conditions
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
