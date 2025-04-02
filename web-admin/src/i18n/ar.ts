import { TranslationMessages } from 'ra-core';
import arabicMessages from 'ra-language-arabic';

const customArabicMessages: TranslationMessages = {
  ...arabicMessages,
  app: {
    title: 'نظام إدارة كراج إيكار',
  },
  menu: {
    dashboard: 'لوحة التحكم',
    customers: 'العملاء',
    vehicles: 'المركبات',
    services: 'الخدمات',
    invoices: 'الفواتير',
    reports: 'التقارير',
  },
  language: {
    current: 'العربية',
    english: 'الإنجليزية',
    french: 'الفرنسية',
    arabic: 'العربية',
  },
  resources: {
    customers: {
      name: 'عميل |||| العملاء',
      fields: {
        id: 'المعرف',
        name: 'الاسم',
        email: 'البريد الإلكتروني',
        phone: 'الهاتف',
        address: 'العنوان',
        created_at: 'تاريخ الإنشاء',
        updated_at: 'تاريخ التحديث',
      },
    },
    vehicles: {
      name: 'مركبة |||| المركبات',
      fields: {
        id: 'المعرف',
        make: 'الصانع',
        model: 'الطراز',
        year: 'السنة',
        license_plate: 'لوحة الترخيص',
        vin: 'رقم التعريف',
        customer_id: 'العميل',
        created_at: 'تاريخ الإنشاء',
        updated_at: 'تاريخ التحديث',
      },
    },
    services: {
      name: 'خدمة |||| الخدمات',
      fields: {
        id: 'المعرف',
        name: 'اسم الخدمة',
        description: 'الوصف',
        price: 'السعر',
        duration: 'المدة (ساعات)',
        vehicle_id: 'المركبة',
        service_date: 'تاريخ الخدمة',
        status: 'الحالة',
        created_at: 'تاريخ الإنشاء',
        updated_at: 'تاريخ التحديث',
      },
    },
    invoices: {
      name: 'فاتورة |||| الفواتير',
      fields: {
        id: 'المعرف',
        invoice_number: 'رقم الفاتورة',
        service_id: 'الخدمة',
        customer_id: 'العميل',
        amount: 'المبلغ',
        issued_date: 'تاريخ الإصدار',
        due_date: 'تاريخ الاستحقاق',
        paid: 'مدفوع',
        payment_date: 'تاريخ الدفع',
        created_at: 'تاريخ الإنشاء',
        updated_at: 'تاريخ التحديث',
      },
    },
  },
  dashboard: {
    welcome: 'مرحبًا بك في نظام إدارة كراج إيكار',
    pending_services: 'الخدمات المعلقة',
    completed_services: 'الخدمات المكتملة',
    revenue_this_month: 'الإيرادات هذا الشهر',
    new_customers: 'العملاء الجدد',
  },
};

export default customArabicMessages; 