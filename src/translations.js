// src/translations.js
const translations = {
    en: {
        pageTitle: "BackgroundCraft-test",
        // Header
        logoTextPart1: "Background",
        logoTextPart2: "Craft",
        selectModuleLabel: "Select Module:",
        loadEffectModuleOption: "-- Load Effect Module --",
        // Sidebar
        controlsSidebarHeading: "INTERFACE",
        suggestionTriggerButtonText: "Briefing",
        suggestionTriggerButtonAriaLabel: "Show Tactical Briefing",
        controlsPlaceholderText: "Awaiting effect module selection...",
        resetParametersButton: "Reset Parameters",
        // Preview Area
        previewAreaHeading: "CRAFT::LIVE_PREVIEW",
        previewCanvasAriaLabel: "Live preview of the selected background effect",
        canvasPlaceholderText: "Engage Rendering Core: Select Module",
        extractCodeButtonText: "EXTRACT CODE SEQUENCE",
        extractCodeButtonAriaLabel: "Extract Code Sequence",
        // Suggestion Modal
        suggestionModalTitle: "Tactical Briefing",
        closeSuggestionModalAriaLabel: "Close Suggestions Modal",
        suggestionItem1Title: "Engage Effect Modules",
        suggestionItem1Desc: "Utilize the \"Select Module\" dropdown to interface with diverse background generation algorithms. Each module possesses unique operational parameters.",
        suggestionItem2Title: "Calibrate Parameters",
        suggestionItem2Desc: "Upon module selection, the \"System Interface\" panel will populate with adjustable parameters. Manipulate values such as color spectrum, particle velocity, and density to achieve desired visual output.",
        suggestionItem3Title: "Real-Time Visualization",
        suggestionItem3Desc: "The \"Visualization Matrix\" provides immediate feedback to parameter adjustments. Observe dynamic resizing capabilities by altering viewport dimensions.",
        suggestionItem4Title: "Code Sequence Extraction",
        suggestionItem4Desc: "Satisfied with the generated visual? Activate \"Extract Code Sequence\". A secure datastream will provide the self-contained HTML/JavaScript protocol for integration.",
        suggestionModalAcknowledgeButton: "Acknowledge",
        // Code Snippet Modal
        codeModalTitle: "Code Sequence Extracted",
        closeCodeModalAriaLabel: "Close Code Modal",
        codeOutputModalInitial: "// Code sequence will materialize here...",
        codeOutputModalErrorBuilder: "// Error: Builder instance not found or generateCodeSnippet is not a function.",
        codeOutputModalSelectModuleFirst: "// Select a module and customize it first.",
        codeOutputModalSystemError: "// ERROR: System integrity compromised. Code generation offline.",
        codeOutputModalNoActiveModule: "// No active module. Engage a module and calibrate parameters to extract code sequence.",
        copySequenceButtonText: "Copy Sequence",
        copyStatusCopied: "Sequence Copied!",
        copyStatusFailed: "Copy Failed!",
        copyStatusNoCode: "No Code!",
        codeModalDismissButton: "Dismiss",
        // Footer
        footerCopyrightText: "BackgroundCraft // FREE AND OPEN SOURCE",
        footerDesignedByText: "Designed & Developed by:",
        // Dynamic texts from BackgroundBuilder
        controlsSystemOffline: "System Offline. Interface Terminated.",
        codeOutputModalSystemOffline: "// System Offline. Code generation unavailable.",
        // Accessibility
        languageChangedAlert: "Language changed to English.",
        selectLanguageLabel: "Select Language",
    },
    es: {
        pageTitle: "BackgroundCraft-prueba",
        // Header
        logoTextPart1: "Fondo",
        logoTextPart2: "Artesanía",
        selectModuleLabel: "Seleccionar Módulo:",
        loadEffectModuleOption: "-- Cargar Módulo de Efecto --",
        // Sidebar
        controlsSidebarHeading: "INTERFAZ",
        suggestionTriggerButtonText: "Informe",
        suggestionTriggerButtonAriaLabel: "Mostrar Informe Táctico",
        controlsPlaceholderText: "Esperando selección de módulo de efecto...",
        resetParametersButton: "Restablecer Parámetros",
        // Preview Area
        previewAreaHeading: "ARTE::VISTA_PREVIA_EN_VIVO",
        previewCanvasAriaLabel: "Vista previa en vivo del efecto de fondo seleccionado",
        canvasPlaceholderText: "Activar Núcleo de Renderizado: Seleccionar Módulo",
        extractCodeButtonText: "EXTRAER SECUENCIA DE CÓDIGO",
        extractCodeButtonAriaLabel: "Extraer Secuencia de Código",
        // Suggestion Modal
        suggestionModalTitle: "Informe Táctico",
        closeSuggestionModalAriaLabel: "Cerrar Modal de Sugerencias",
        suggestionItem1Title: "Activar Módulos de Efecto",
        suggestionItem1Desc: "Utilice el menú desplegable \"Seleccionar Módulo\" para interactuar con diversos algoritmos de generación de fondos. Cada módulo posee parámetros operativos únicos.",
        suggestionItem2Title: "Calibrar Parámetros",
        suggestionItem2Desc: "Tras la selección del módulo, el panel \"Interfaz del Sistema\" se poblará con parámetros ajustables. Manipule valores como el espectro de color, la velocidad de las partículas y la densidad para lograr la salida visual deseada.",
        suggestionItem3Title: "Visualización en Tiempo Real",
        suggestionItem3Desc: "La \"Matriz de Visualización\" proporciona retroalimentación inmediata a los ajustes de parámetros. Observe las capacidades de redimensionamiento dinámico alterando las dimensiones de la ventana gráfica.",
        suggestionItem4Title: "Extracción de Secuencia de Código",
        suggestionItem4Desc: "¿Satisfecho con el visual generado? Active \"Extraer Secuencia de Código\". Un flujo de datos seguro proporcionará el protocolo HTML/JavaScript autónomo para la integración.",
        suggestionModalAcknowledgeButton: "Entendido",
        // Code Snippet Modal
        codeModalTitle: "Secuencia de Código Extraída",
        closeCodeModalAriaLabel: "Cerrar Modal de Código",
        codeOutputModalInitial: "// La secuencia de código se materializará aquí...",
        codeOutputModalErrorBuilder: "// Error: Instancia del constructor no encontrada o generateCodeSnippet no es una función.",
        codeOutputModalSelectModuleFirst: "// Seleccione un módulo y personalícelo primero.",
        codeOutputModalSystemError: "// ERROR: Integridad del sistema comprometida. Generación de código fuera de línea.",
        codeOutputModalNoActiveModule: "// Ningún módulo activo. Active un módulo y calibre los parámetros para extraer la secuencia de código.",
        copySequenceButtonText: "Copiar Secuencia",
        copyStatusCopied: "¡Secuencia Copiada!",
        copyStatusFailed: "¡Fallo al Copiar!",
        copyStatusNoCode: "¡Sin Código!",
        codeModalDismissButton: "Descartar",
        // Footer
        footerCopyrightText: "BackgroundCraft // GRATUITO Y DE CÓDIGO ABIERTO",
        footerDesignedByText: "Diseñado y Desarrollado por:",
        // Dynamic texts from BackgroundBuilder
        controlsSystemOffline: "Sistema Fuera de Línea. Interfaz Terminada.",
        codeOutputModalSystemOffline: "// Sistema Fuera de Línea. Generación de código no disponible.",
        // Accessibility
        languageChangedAlert: "Idioma cambiado a Español.",
        selectLanguageLabel: "Seleccionar Idioma",
    },
    it: {
        pageTitle: "BackgroundCraft-test",
        // Header
        logoTextPart1: "Sfondo",
        logoTextPart2: "Creazione",
        selectModuleLabel: "Seleziona Modulo:",
        loadEffectModuleOption: "-- Carica Modulo Effetto --",
        // Sidebar
        controlsSidebarHeading: "INTERFACCIA",
        suggestionTriggerButtonText: "Briefing",
        suggestionTriggerButtonAriaLabel: "Mostra Briefing Tattico",
        controlsPlaceholderText: "In attesa della selezione del modulo effetto...",
        resetParametersButton: "Reimposta Parametri",
        // Preview Area
        previewAreaHeading: "CREA::ANTEPRIMA_LIVE",
        previewCanvasAriaLabel: "Anteprima live dell'effetto di sfondo selezionato",
        canvasPlaceholderText: "Attiva Nucleo di Rendering: Seleziona Modulo",
        extractCodeButtonText: "ESTRAI SEQUENZA CODICE",
        extractCodeButtonAriaLabel: "Estrai Sequenza Codice",
        // Suggestion Modal
        suggestionModalTitle: "Briefing Tattico",
        closeSuggestionModalAriaLabel: "Chiudi Modale Suggerimenti",
        suggestionItem1Title: "Attiva Moduli Effetto",
        suggestionItem1Desc: "Utilizza il menu a discesa \"Seleziona Modulo\" per interfacciarti con diversi algoritmi di generazione di sfondi. Ogni modulo possiede parametri operativi unici.",
        suggestionItem2Title: "Calibra Parametri",
        suggestionItem2Desc: "Dopo la selezione del modulo, il pannello \"Interfaccia di Sistema\" si popolerà con parametri regolabili. Manipola valori come lo spettro dei colori, la velocità delle particelle e la densità per ottenere l'output visivo desiderato.",
        suggestionItem3Title: "Visualizzazione in Tempo Reale",
        suggestionItem3Desc: "La \"Matrice di Visualizzazione\" fornisce un feedback immediato alle regolazioni dei parametri. Osserva le capacità di ridimensionamento dinamico modificando le dimensioni della viewport.",
        suggestionItem4Title: "Estrazione Sequenza Codice",
        suggestionItem4Desc: "Soddisfatto dell'immagine generata? Attiva \"Estrai Sequenza Codice\". Un flusso di dati sicuro fornirà il protocollo HTML/JavaScript autonomo per l'integrazione.",
        suggestionModalAcknowledgeButton: "Conferma",
        // Code Snippet Modal
        codeModalTitle: "Sequenza Codice Estratta",
        closeCodeModalAriaLabel: "Chiudi Modale Codice",
        codeOutputModalInitial: "// La sequenza di codice si materializzerà qui...",
        codeOutputModalErrorBuilder: "// Errore: Istanza del costruttore non trovata o generateCodeSnippet non è una funzione.",
        codeOutputModalSelectModuleFirst: "// Seleziona un modulo e personalizzalo prima.",
        codeOutputModalSystemError: "// ERRORE: Integrità del sistema compromessa. Generazione codice offline.",
        codeOutputModalNoActiveModule: "// Nessun modulo attivo. Attiva un modulo e calibra i parametri per estrarre la sequenza codice.",
        copySequenceButtonText: "Copia Sequenza",
        copyStatusCopied: "Sequenza Copiata!",
        copyStatusFailed: "Copia Fallita!",
        copyStatusNoCode: "Nessun Codice!",
        codeModalDismissButton: "Ignora",
        // Footer
        footerCopyrightText: "BackgroundCraft // GRATUITO E OPEN SOURCE",
        footerDesignedByText: "Progettato e Sviluppato da:",
        // Dynamic texts from BackgroundBuilder
        controlsSystemOffline: "Sistema Offline. Interfaccia Terminata.",
        codeOutputModalSystemOffline: "// Sistema Offline. Generazione codice non disponibile.",
        // Accessibility
        languageChangedAlert: "Lingua cambiata in Italiano.",
        selectLanguageLabel: "Seleziona Lingua",
    }
};

export default translations;