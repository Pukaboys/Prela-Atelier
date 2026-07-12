export const LANGUAGE_COOKIE = 'prela_lang'

export type LanguageCode = 'en' | 'sq'

export interface ClientDictionary {
  banner: { dismiss: string }
  termsConsent: {
    eyebrow: string
    title: string
    text: string
    terms: string
    privacy: string
    returns: string
    and: string
    accept: string
    reject: string
  }
  currency: {
    label: string
    ariaLabel: string
    options: Record<'EUR' | 'USD' | 'GBP', string>
  }
  nav: {
    mainNavigation: string
    mobileNavigation: string
    collections: string
    materials: string
    bespoke: string
    about: string
    cart: string
    language: string
    openMenu: string
    closeMenu: string
    cartAria: (count: number) => string
  }
  common: {
    viewDetails: string
    selected: string
    notSelected: string
    quantity: string
    remove: string
    continue: string
    back: string
    free: string
    subtotal: string
    shipping: string
    total: string
    orderSummary: string
    browseCollections: string
    continueShopping: string
    proceedToCheckout: string
    secureCheckout: string
    certificateOfAuthenticity: string
    step: (step: number) => string
    stepOf: (step: number, total: number) => string
  }
  cart: {
    shopping: string
    title: string
    empty: string
    product: string
    price: string
    qty: string
    shipTo: string
    shippingDestination: string
    shippingQuestion: string
    shippingPrompt: string
    continueToCart: string
    freeShippingOver: (amount: string) => string
  }
  checkout: {
    purchase: string
    title: string
    deliveryDetails: string
    fullName: string
    emailAddress: string
    phone: string
    streetAddress: string
    city: string
    postcode: string
    country: string
    orderNotes: string
    optional: string
    promoCode: string
    apply: string
    remove: string
    payment: string
    or: string
    placingOrder: string
    preparingPayment: string
    payWithCard: string
    placeOrderBankTransfer: string
    bankTransferNote: string
    qtyValue: (qty: number) => string
    sslCheckout: string
    deliveryWindow: string
    certificateIncluded: string
    backToCart: string
    validationName: string
    validationEmail: string
    validationAddress: string
    validationCity: string
    validationPostcode: string
    failedToPlaceOrder: string
    networkError: string
    invalidPromo: string
    promoValidationFailed: string
  }
  product: {
    backToCollections: string
    defaultEyebrow: string
    material: string
    selectMaterial: string
    stoneProperties: string
    hardness: string
    tone: string
    veining: string
    learnMoreAbout: (material: string) => string
    freeShippingOver: (amount: string) => string
    estimatedDelivery: string
    certificateIncluded: string
    outOfStock: string
    adding: string
    addedToCart: string
    addToCart: string
    madeToOrder: string
    inStock: (count: number) => string
  }
  trackOrder: {
    delivery: string
    title: string
    orderCode: string
    emailAddress: string
    search: string
    searching: string
    enterBoth: string
    orderNotFound: string
    networkError: string
    orderLabel: string
    placedOn: (date: string) => string
    productionProgress: string
    estimatedCompletion: string
    currentStageEstimate: (stage: string, days: number) => string
    orderProgress: string
    cancelledTitle: string
    cancelledText: string
    deliveryAddress: string
    note: string
    items: string
    statusLabels: Record<'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled', string>
    productionStageLabels: Record<'Design' | 'Cutting' | 'Polishing' | 'Finishing' | 'Ready', string>
  }
  customOrderBuilder: {
    steps: readonly string[]
    successTitle: string
    successText: string
    structuredBuilder: string
    title: string
    width: string
    height: string
    thickness: string
    quantity: string
    preview2d: string
    dimensions: string
    material: string
    calculatedQuote: string
    estimateGenerated: (date: string) => string
    estimatedTotal: string
    areaPerPiece: string
    totalArea: string
    materialCost: string
    productionCost: string
    fullName: string
    emailAddress: string
    typeOfPiece: string
    budgetRange: string
    describeVision: string
    timelineDeadline: string
    materialOrigin: string
    thicknessFactor: string
    typePlaceholder: string
    budgetPlaceholder: string
    deadlinePlaceholder: string
    calculateQuote: string
    calculating: string
    sendEnquiryWithQuote: string
    sending: string
    validationDimensions: string
    validationQuantity: string
    validationMaterial: string
    validationContact: string
    unableToCalculate: string
    networkCalculate: string
    calculateFirst: string
    networkError: string
    selectedStone: string
    standardThickness: string
    typeOptions: { value: string; label: string }[]
    budgetOptions: { value: string; label: string }[]
  }
}

export function normalizeLanguage(value?: string | null): LanguageCode {
  return value === 'sq' ? 'sq' : 'en'
}

const dictionaries: Record<LanguageCode, ClientDictionary> = {
  en: {
    banner: { dismiss: 'Dismiss banner' },
    termsConsent: {
      eyebrow: 'Terms & Privacy',
      title: 'Before you continue',
      text: 'Please review and choose whether you accept our website terms, privacy policy, and returns information.',
      terms: 'Terms & Conditions',
      privacy: 'Privacy Policy',
      returns: 'Returns Policy',
      and: 'and',
      accept: 'Accept',
      reject: 'Reject',
    },
    currency: {
      label: 'Currency',
      ariaLabel: 'Display currency',
      options: { EUR: 'EUR - Euro', USD: 'USD - Dollar', GBP: 'GBP - Pound' },
    },
    nav: {
      mainNavigation: 'Main navigation',
      mobileNavigation: 'Mobile navigation',
      collections: 'Collections',
      materials: 'Materials',
      bespoke: 'Bespoke',
      about: 'About',
      cart: 'Cart',
      language: 'Language',
      openMenu: 'Open menu',
      closeMenu: 'Close menu',
      cartAria: (count) => `Cart - ${count} items`,
    },
    common: {
      viewDetails: 'View Details',
      selected: 'Selected',
      notSelected: 'Not selected',
      quantity: 'Quantity',
      remove: 'Remove',
      continue: 'Continue',
      back: 'Back',
      free: 'Free',
      subtotal: 'Subtotal',
      shipping: 'Shipping',
      total: 'Total',
      orderSummary: 'Order Summary',
      browseCollections: 'Browse Collections',
      continueShopping: 'Continue Shopping',
      proceedToCheckout: 'Proceed to Checkout',
      secureCheckout: 'Secure checkout',
      certificateOfAuthenticity: 'Certificate of authenticity',
      step: (step) => `Step ${step}`,
      stepOf: (step, total) => `Step ${step} of ${total}`,
    },
    cart: {
      shopping: 'Shopping',
      title: 'Your Cart',
      empty: 'Your cart is empty.',
      product: 'Product',
      price: 'Price',
      qty: 'Qty',
      shipTo: 'Ship to',
      shippingDestination: 'Shipping Destination',
      shippingQuestion: 'Where are we shipping to?',
      shippingPrompt: 'Select your country so we can show the correct shipping cost for your order.',
      continueToCart: 'Continue to Cart',
      freeShippingOver: (amount) => `Free shipping on orders over ${amount}.`,
    },
    checkout: {
      purchase: 'Purchase',
      title: 'Checkout',
      deliveryDetails: 'Delivery Details',
      fullName: 'Full Name *',
      emailAddress: 'Email Address *',
      phone: 'Phone / WhatsApp',
      streetAddress: 'Street Address *',
      city: 'City *',
      postcode: 'Postcode *',
      country: 'Country *',
      orderNotes: 'Order Notes',
      optional: '(optional)',
      promoCode: 'Promo Code',
      apply: 'Apply',
      remove: 'Remove',
      payment: 'Payment',
      or: 'or',
      placingOrder: 'Placing Order...',
      preparingPayment: 'Preparing secure payment...',
      payWithCard: 'Pay with POK',
      placeOrderBankTransfer: 'Place Order (Bank Transfer)',
      bankTransferNote: 'Bank transfer details will be provided in your confirmation email. Your order will be held for 3 business days.',
      qtyValue: (qty) => `Qty: ${qty}`,
      sslCheckout: 'SSL secured checkout',
      deliveryWindow: '5-7 day delivery',
      certificateIncluded: 'Certificate of authenticity included',
      backToCart: 'Back to Cart',
      validationName: 'Please enter your name.',
      validationEmail: 'Please enter a valid email address.',
      validationAddress: 'Please enter your address.',
      validationCity: 'Please enter your city.',
      validationPostcode: 'Please enter your postcode.',
      failedToPlaceOrder: 'Failed to place order.',
      networkError: 'Network error. Please try again.',
      invalidPromo: 'Invalid promo code.',
      promoValidationFailed: 'Could not validate promo code.',
    },
    product: {
      backToCollections: 'Back to Collections',
      defaultEyebrow: 'Prela Atelier - Natural Stone Object',
      material: 'Material',
      selectMaterial: 'Select material',
      stoneProperties: 'Stone Properties',
      hardness: 'Hardness',
      tone: 'Tone',
      veining: 'Veining',
      learnMoreAbout: (material) => `Learn more about ${material}`,
      freeShippingOver: (amount) => `Free shipping on orders over ${amount}`,
      estimatedDelivery: 'Estimated delivery: 5-7 business days',
      certificateIncluded: 'Includes stone documentation & certificate of authenticity',
      outOfStock: 'Out of Stock',
      adding: 'Adding...',
      addedToCart: 'Added to Cart',
      addToCart: 'Add to Cart',
      madeToOrder: 'Made to order',
      inStock: (count) => `${count} in stock`,
    },
    trackOrder: {
      delivery: 'Delivery',
      title: 'Track Your Order',
      orderCode: 'Order Code',
      emailAddress: 'Email Address',
      search: 'Track Order',
      searching: 'Searching...',
      enterBoth: 'Please enter both your order code and email address.',
      orderNotFound: 'Order not found.',
      networkError: 'Network error. Please try again.',
      orderLabel: 'Order',
      placedOn: (date) => `Placed on ${date}`,
      productionProgress: 'Production Progress',
      estimatedCompletion: 'Estimated Completion',
      currentStageEstimate: (stage, days) =>
        `Current stage: ${stage}. Estimated stage time is ${days} day${days === 1 ? '' : 's'}.`,
      orderProgress: 'Order Progress',
      cancelledTitle: 'Order Cancelled',
      cancelledText: 'This order has been cancelled. Please contact us if you have questions.',
      deliveryAddress: 'Delivery Address',
      note: 'Note',
      items: 'Items',
      statusLabels: { pending: 'Order Received', confirmed: 'Confirmed', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled' },
      productionStageLabels: { Design: 'Design', Cutting: 'Cutting', Polishing: 'Polishing', Finishing: 'Finishing', Ready: 'Ready' },
    },
    customOrderBuilder: {
      steps: ['Dimensions', 'Material', 'Preview', 'Result'] as const,
      successTitle: 'Enquiry Received',
      successText: 'Your structured quote and design brief have been sent to our team and attached to the enquiry for review.',
      structuredBuilder: 'Structured Builder',
      title: 'Custom Order Builder',
      width: 'Width (cm) *',
      height: 'Height (cm) *',
      thickness: 'Thickness (cm)',
      quantity: 'Quantity *',
      preview2d: '2D Preview',
      dimensions: 'Dimensions',
      material: 'Material',
      calculatedQuote: 'Calculated Quote',
      estimateGenerated: (date) => `Estimate generated ${date}`,
      estimatedTotal: 'Estimated Total',
      areaPerPiece: 'Area per piece',
      totalArea: 'Total area',
      materialCost: 'Material cost',
      productionCost: 'Production cost',
      fullName: 'Full Name *',
      emailAddress: 'Email Address *',
      typeOfPiece: 'Type of Piece',
      budgetRange: 'Budget Range',
      describeVision: 'Describe Your Vision *',
      timelineDeadline: 'Timeline / Deadline',
      materialOrigin: 'Material origin',
      thicknessFactor: 'Thickness factor',
      typePlaceholder: 'Select a category...',
      budgetPlaceholder: 'Select a range...',
      deadlinePlaceholder: 'Required by September 2026, no rush, etc.',
      calculateQuote: 'Calculate Quote',
      calculating: 'Calculating...',
      sendEnquiryWithQuote: 'Send Enquiry with Quote',
      sending: 'Sending...',
      validationDimensions: 'Please enter valid width and height in centimetres.',
      validationQuantity: 'Quantity must be at least 1.',
      validationMaterial: 'Please select a material.',
      validationContact: 'Please complete your contact details and project description.',
      unableToCalculate: 'Unable to calculate the quote.',
      networkCalculate: 'Network error while calculating the quote.',
      calculateFirst: 'Please calculate your quote before sending the enquiry.',
      networkError: 'Network error. Please try again.',
      selectedStone: 'Selected stone',
      standardThickness: 'Standard 2 cm',
      typeOptions: [
        { value: 'Tray', label: 'Tray' },
        { value: 'Bowl or Vessel', label: 'Bowl or Vessel' },
        { value: 'Candle Holder', label: 'Candle Holder' },
        { value: 'Sculptural Object', label: 'Sculptural Object' },
        { value: 'Furniture Component', label: 'Furniture Component' },
        { value: 'Architectural Detail', label: 'Architectural Detail' },
        { value: 'Custom / Other', label: 'Custom / Other' },
      ],
      budgetOptions: [
        { value: '200-500 EUR', label: '200-500 EUR' },
        { value: '500-1,000 EUR', label: '500-1,000 EUR' },
        { value: '1,000-2,500 EUR', label: '1,000-2,500 EUR' },
        { value: '2,500-5,000 EUR', label: '2,500-5,000 EUR' },
        { value: '5,000+ EUR', label: '5,000+ EUR' },
        { value: 'To be discussed', label: 'To be discussed' },
      ],
    },
  },
  sq: {
    banner: { dismiss: 'Mbyll njoftimin' },
    termsConsent: {
      eyebrow: 'Kushtet & Privatesia',
      title: 'Para se te vazhdoni',
      text: 'Ju lutem lexoni dhe zgjidhni nese pranoni kushtet e faqes, politiken e privatesise dhe informacionin per kthimet.',
      terms: 'Kushtet',
      privacy: 'Privatesia',
      returns: 'Kthimet',
      and: 'dhe',
      accept: 'Prano',
      reject: 'Refuzo',
    },
    currency: {
      label: 'Monedha',
      ariaLabel: 'Monedha e shfaqjes',
      options: { EUR: 'EUR - Euro', USD: 'USD - Dollar', GBP: 'GBP - Pound' },
    },
    nav: {
      mainNavigation: 'Navigimi kryesor',
      mobileNavigation: 'Navigimi mobil',
      collections: 'Koleksione',
      materials: 'Materialet',
      bespoke: 'Me Porosi',
      about: 'Rreth Nesh',
      cart: 'Shporta',
      language: 'Gjuha',
      openMenu: 'Hap menune',
      closeMenu: 'Mbyll menune',
      cartAria: (count) => `Shporta - ${count} artikuj`,
    },
    common: {
      viewDetails: 'Shiko Detajet',
      selected: 'Zgjedhur',
      notSelected: 'Pa zgjedhur',
      quantity: 'Sasia',
      remove: 'Hiq',
      continue: 'Vazhdo',
      back: 'Mbrapa',
      free: 'Falas',
      subtotal: 'Nentotali',
      shipping: 'Dergesa',
      total: 'Totali',
      orderSummary: 'Permbledhja e Porosise',
      browseCollections: 'Shiko Koleksionet',
      continueShopping: 'Vazhdo Blerjen',
      proceedToCheckout: 'Vazhdo te Pagesa',
      secureCheckout: 'Pagese e sigurt',
      certificateOfAuthenticity: 'Certifikate autenticiteti',
      step: (step) => `Hapi ${step}`,
      stepOf: (step, total) => `Hapi ${step} nga ${total}`,
    },
    cart: {
      shopping: 'Blerje',
      title: 'Shporta Juaj',
      empty: 'Shporta juaj eshte bosh.',
      product: 'Produkti',
      price: 'Cmimi',
      qty: 'Sasia',
      shipTo: 'Dergo ne',
      shippingDestination: 'Destinacioni i Dergeses',
      shippingQuestion: 'Ku do ta dergojme?',
      shippingPrompt: 'Zgjidhni shtetin tuaj qe t\'ju shfaqim koston e sakte te dergeses per porosine tuaj.',
      continueToCart: 'Vazhdo te Shporta',
      freeShippingOver: (amount) => `Dergese falas per porosi mbi ${amount}.`,
    },
    checkout: {
      purchase: 'Blerje',
      title: 'Pagesa',
      deliveryDetails: 'Detajet e Dergeses',
      fullName: 'Emri i Plote *',
      emailAddress: 'Adresa Email *',
      phone: 'Telefon / WhatsApp',
      streetAddress: 'Adresa *',
      city: 'Qyteti *',
      postcode: 'Kodi Postar *',
      country: 'Shteti *',
      orderNotes: 'Shenime per Porosine',
      optional: '(opsionale)',
      promoCode: 'Kodi Promocional',
      apply: 'Apliko',
      remove: 'Hiq',
      payment: 'Pagesa',
      or: 'ose',
      placingOrder: 'Duke vendosur porosine...',
      preparingPayment: 'Duke pergatitur pagesen e sigurt...',
      payWithCard: 'Paguaj me POK',
      placeOrderBankTransfer: 'Vendos Porosine (Transferte Bankare)',
      bankTransferNote: 'Detajet e transfertes bankare do te dergohen ne emailin tuaj te konfirmimit. Porosia do te mbahet per 3 dite pune.',
      qtyValue: (qty) => `Sasia: ${qty}`,
      sslCheckout: 'Pagese e siguruar me SSL',
      deliveryWindow: 'Dergese 5-7 dite',
      certificateIncluded: 'Certifikate autenticiteti e perfshire',
      backToCart: 'Mbrapa te Shporta',
      validationName: 'Ju lutem shkruani emrin tuaj.',
      validationEmail: 'Ju lutem shkruani nje email te vlefshem.',
      validationAddress: 'Ju lutem shkruani adresen tuaj.',
      validationCity: 'Ju lutem shkruani qytetin tuaj.',
      validationPostcode: 'Ju lutem shkruani kodin postar.',
      failedToPlaceOrder: 'Vendosja e porosise deshtoi.',
      networkError: 'Gabim rrjeti. Ju lutem provoni perseri.',
      invalidPromo: 'Kodi promocional eshte i pavlefshem.',
      promoValidationFailed: 'Kodi promocional nuk mund te verifikohet.',
    },
    product: {
      backToCollections: 'Kthehu te Koleksionet',
      defaultEyebrow: 'Prela Atelier - Objekt guri natyral',
      material: 'Materiali',
      selectMaterial: 'Zgjidh materialin',
      stoneProperties: 'Karakteristikat e Gurit',
      hardness: 'Fortesia',
      tone: 'Toni',
      veining: 'Damarimi',
      learnMoreAbout: (material) => `Meso me shume per ${material}`,
      freeShippingOver: (amount) => `Dergese falas per porosi mbi ${amount}`,
      estimatedDelivery: 'Dergese e vleresuar: 5-7 dite pune',
      certificateIncluded: 'Perfshin dokumentacionin e gurit dhe certifikaten e autenticitetit',
      outOfStock: 'Pa Stok',
      adding: 'Duke shtuar...',
      addedToCart: 'U shtua ne Shporte',
      addToCart: 'Shto ne Shporte',
      madeToOrder: 'Me porosi',
      inStock: (count) => `${count} ne stok`,
    },
    trackOrder: {
      delivery: 'Dergesa',
      title: 'Gjurmo Porosine',
      orderCode: 'Kodi i Porosise',
      emailAddress: 'Adresa Email',
      search: 'Gjurmo Porosine',
      searching: 'Duke kerkuar...',
      enterBoth: 'Ju lutem shkruani kodin e porosise dhe adresen e emailit.',
      orderNotFound: 'Porosia nuk u gjet.',
      networkError: 'Gabim rrjeti. Ju lutem provoni perseri.',
      orderLabel: 'Porosia',
      placedOn: (date) => `Vendosur me ${date}`,
      productionProgress: 'Progresi i Prodhimit',
      estimatedCompletion: 'Perfundimi i Vleresuar',
      currentStageEstimate: (stage, days) =>
        `Faza aktuale: ${stage}. Koha e vleresuar per kete faze eshte ${days} dite.`,
      orderProgress: 'Progresi i Porosise',
      cancelledTitle: 'Porosia eshte Anuluar',
      cancelledText: 'Kjo porosi eshte anuluar. Ju lutem na kontaktoni nese keni pyetje.',
      deliveryAddress: 'Adresa e Dergeses',
      note: 'Shenim',
      items: 'Artikujt',
      statusLabels: { pending: 'Porosia u mor', confirmed: 'Konfirmuar', shipped: 'Derguar', delivered: 'Dorezuar', cancelled: 'Anuluar' },
      productionStageLabels: { Design: 'Dizajni', Cutting: 'Prerja', Polishing: 'Polirimi', Finishing: 'Perfundimi', Ready: 'Gati' },
    },
    customOrderBuilder: {
      steps: ['Permasat', 'Materiali', 'Pamja', 'Rezultati'] as const,
      successTitle: 'Kerkesa u Pranua',
      successText: 'Oferta juaj e strukturuar dhe pershkrimi i projektit jane derguar ekipit tone dhe i jane bashkengjitur kerkeses per shqyrtim.',
      structuredBuilder: 'Ndertues i Strukturuar',
      title: 'Ndertuesi i Porosise',
      width: 'Gjeresia (cm) *',
      height: 'Lartesia (cm) *',
      thickness: 'Trashesia (cm)',
      quantity: 'Sasia *',
      preview2d: 'Pamje 2D',
      dimensions: 'Permasat',
      material: 'Materiali',
      calculatedQuote: 'Oferta e Llogaritur',
      estimateGenerated: (date) => `Vleresimi u gjenerua me ${date}`,
      estimatedTotal: 'Totali i Vleresuar',
      areaPerPiece: 'Siperfaqja per pjese',
      totalArea: 'Siperfaqja totale',
      materialCost: 'Kosto materiali',
      productionCost: 'Kosto prodhimi',
      fullName: 'Emri i Plote *',
      emailAddress: 'Adresa Email *',
      typeOfPiece: 'Lloji i Pjeses',
      budgetRange: 'Intervali i Buxhetit',
      describeVision: 'Pershkruani Idete Tuaja *',
      timelineDeadline: 'Afati / Deadline',
      materialOrigin: 'Origjina e materialit',
      thicknessFactor: 'Faktori i trashesise',
      typePlaceholder: 'Zgjidh nje kategori...',
      budgetPlaceholder: 'Zgjidh nje interval...',
      deadlinePlaceholder: 'Duhet deri ne shtator 2026, pa nxitim, etj.',
      calculateQuote: 'Llogarit Oferten',
      calculating: 'Duke llogaritur...',
      sendEnquiryWithQuote: 'Dergo Kerkesen me Oferten',
      sending: 'Duke derguar...',
      validationDimensions: 'Ju lutem vendosni gjeresi dhe lartesi te vlefshme ne centimetra.',
      validationQuantity: 'Sasia duhet te jete te pakten 1.',
      validationMaterial: 'Ju lutem zgjidhni nje material.',
      validationContact: 'Ju lutem plotesoni te dhenat e kontaktit dhe pershkrimin e projektit.',
      unableToCalculate: 'Nuk u arrit te llogaritet oferta.',
      networkCalculate: 'Gabim rrjeti gjate llogaritjes se ofertes.',
      calculateFirst: 'Ju lutem llogaritni oferten perpara se te dergoni kerkesen.',
      networkError: 'Gabim rrjeti. Ju lutem provoni perseri.',
      selectedStone: 'Guri i zgjedhur',
      standardThickness: 'Standard 2 cm',
      typeOptions: [
        { value: 'Tray', label: 'Tabaka' },
        { value: 'Bowl or Vessel', label: 'Tas ose Ene' },
        { value: 'Candle Holder', label: 'Mbajtese Qiriu' },
        { value: 'Sculptural Object', label: 'Objekt Skulpturor' },
        { value: 'Furniture Component', label: 'Komponent Mobiljeje' },
        { value: 'Architectural Detail', label: 'Detaj Arkitekturor' },
        { value: 'Custom / Other', label: 'Personalizuar / Tjeter' },
      ],
      budgetOptions: [
        { value: '200-500 EUR', label: '200-500 EUR' },
        { value: '500-1,000 EUR', label: '500-1,000 EUR' },
        { value: '1,000-2,500 EUR', label: '1,000-2,500 EUR' },
        { value: '2,500-5,000 EUR', label: '2,500-5,000 EUR' },
        { value: '5,000+ EUR', label: '5,000+ EUR' },
        { value: 'To be discussed', label: 'Per t\'u diskutuar' },
      ],
    },
  },
}

export function getClientDictionary(language: LanguageCode): ClientDictionary {
  return dictionaries[language]
}
