import { TranslationMessages } from 'ra-core';
import frenchMessages from 'ra-language-french';

const customFrenchMessages: TranslationMessages = {
  ...frenchMessages,
  app: {
    title: 'Gestion de Garage ECAR',
  },
  menu: {
    dashboard: 'Tableau de bord',
    customers: 'Clients',
    vehicles: 'Véhicules',
    services: 'Services',
    invoices: 'Factures',
    reports: 'Rapports',
  },
  language: {
    current: 'Français',
    english: 'Anglais',
    french: 'Français',
    arabic: 'Arabe',
  },
  resources: {
    customers: {
      name: 'Client |||| Clients',
      fields: {
        id: 'ID',
        name: 'Nom',
        email: 'Email',
        phone: 'Téléphone',
        address: 'Adresse',
        created_at: 'Créé le',
        updated_at: 'Mis à jour le',
      },
    },
    vehicles: {
      name: 'Véhicule |||| Véhicules',
      fields: {
        id: 'ID',
        make: 'Marque',
        model: 'Modèle',
        year: 'Année',
        license_plate: 'Plaque d\'immatriculation',
        vin: 'Numéro de série',
        customer_id: 'Client',
        created_at: 'Créé le',
        updated_at: 'Mis à jour le',
      },
    },
    services: {
      name: 'Service |||| Services',
      fields: {
        id: 'ID',
        name: 'Nom du service',
        description: 'Description',
        price: 'Prix',
        duration: 'Durée (heures)',
        vehicle_id: 'Véhicule',
        service_date: 'Date du service',
        status: 'Statut',
        created_at: 'Créé le',
        updated_at: 'Mis à jour le',
      },
    },
    invoices: {
      name: 'Facture |||| Factures',
      fields: {
        id: 'ID',
        invoice_number: 'Numéro de facture',
        service_id: 'Service',
        customer_id: 'Client',
        amount: 'Montant',
        issued_date: 'Date d\'émission',
        due_date: 'Date d\'échéance',
        paid: 'Payé',
        payment_date: 'Date de paiement',
        created_at: 'Créé le',
        updated_at: 'Mis à jour le',
      },
    },
  },
  dashboard: {
    welcome: 'Bienvenue sur la gestion de garage ECAR',
    pending_services: 'Services en attente',
    completed_services: 'Services terminés',
    revenue_this_month: 'Revenu ce mois-ci',
    new_customers: 'Nouveaux clients',
  },
};

export default customFrenchMessages; 