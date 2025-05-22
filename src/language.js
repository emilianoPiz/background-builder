// src/language.js
import translations from './translations.js';

const languageSelector = document.getElementById('language-select');
const defaultLang = 'en';
let currentLang = defaultLang;

// Store references to elements that have dynamic text content updated outside this script.
// This helps manage their state during language changes.
const copyCodeModalButton = document.getElementById('copy-code-modal-button');
const copyStatusTextModal = copyCodeModalButton ? copyCodeModalButton.querySelector('.copy-status-text-modal') : null;
const codeOutputModalElem = document.getElementById('code-output-modal');

// Store initial states or keys for dynamic elements
let originalModalCopyButtonTextKey = 'copySequenceButtonText';
let initialCodeOutputModalTextKey = 'codeOutputModalInitial';


function setLanguage(lang) {
    if (!translations[lang]) {
        console.warn(`Language ${lang} not found. Defaulting to ${defaultLang}.`);
        lang = defaultLang;
    }
    currentLang = lang;
    document.documentElement.lang = lang;
    localStorage.setItem('preferredLanguage', lang);

    const currentTranslations = translations[lang];
    const defaultTranslations = translations[defaultLang];

    // Update page title
    document.title = currentTranslations.pageTitle || defaultTranslations.pageTitle;

    // Update textContent for elements with data-lang-key
    document.querySelectorAll('[data-lang-key]').forEach(el => {
        const key = el.dataset.langKey;
        el.textContent = currentTranslations[key] !== undefined ? currentTranslations[key] : (defaultTranslations[key] || `KEY:${key}`);
    });

    // Update attributes
    const attributeTypes = ['placeholder', 'aria-label', 'title'];
    attributeTypes.forEach(attr => {
        document.querySelectorAll(`[data-lang-key-${attr}]`).forEach(el => {
            const key = el.dataset[`langKey${attr.charAt(0).toUpperCase() + attr.slice(1)}`]; // e.g. langKeyPlaceholder
            const translation = currentTranslations[key] !== undefined ? currentTranslations[key] : (defaultTranslations[key] || `ATTR_KEY:${key}`);
            el.setAttribute(attr, translation);
        });
    });
    
    // Special handling for the language selector's own aria-label if its label is visually hidden
    const langSelectLabel = document.getElementById('language-select-label');
    if (langSelectLabel && languageSelector) {
        const labelKey = "selectLanguageLabel";
        const labelText = currentTranslations[labelKey] || defaultTranslations[labelKey];
        langSelectLabel.textContent = labelText; // Also update its text content if it were visible
        languageSelector.setAttribute('aria-label', labelText);
    }


    // Update dynamic text elements
    // Copy button: Reset its text if it's not showing a status message
    if (copyStatusTextModal && copyCodeModalButton) {
        const currentButtonText = copyStatusTextModal.textContent;
        const translatedCopyText = currentTranslations[originalModalCopyButtonTextKey] || defaultTranslations[originalModalCopyButtonTextKey];
        
        // Check if current text is one of the status messages (in any language to be robust)
        let isStatusMessage = false;
        ['copyStatusCopied', 'copyStatusFailed', 'copyStatusNoCode'].forEach(statusKey => {
            Object.values(translations).forEach(langPack => {
                if (langPack[statusKey] === currentButtonText) {
                    isStatusMessage = true;
                }
            });
        });

        if (!isStatusMessage) {
            copyStatusTextModal.textContent = translatedCopyText;
        }
        // Update the global/module-scoped variable that the original script might use to reset
        if (window.updateOriginalModalCopyText) { // Function exposed by inline script
            window.updateOriginalModalCopyText(translatedCopyText);
        }
    }

    // Code output modal: Update initial placeholder text
    if (codeOutputModalElem) {
        const currentModalText = codeOutputModalElem.textContent.trim();
        const translatedInitialText = currentTranslations[initialCodeOutputModalTextKey] || defaultTranslations[initialCodeOutputModalTextKey];
        
        // Check if the current text matches any language's initial placeholder
        let isInitialPlaceholder = false;
        Object.values(translations).forEach(langPack => {
            if (langPack[initialCodeOutputModalTextKey] === currentModalText) {
                isInitialPlaceholder = true;
            }
        });
        const isErrorBuilderText = Object.values(translations).some(langPack => langPack['codeOutputModalErrorBuilder'] === currentModalText);


        if (isInitialPlaceholder || isErrorBuilderText) { // Only update if it's a known initial state
             if (isInitialPlaceholder) codeOutputModalElem.textContent = translatedInitialText;
             if (isErrorBuilderText) codeOutputModalElem.textContent = currentTranslations['codeOutputModalErrorBuilder'] || defaultTranslations['codeOutputModalErrorBuilder'];
        }
    }

    // Update builder instance's internal state
    if (window.builderInstance && typeof window.builderInstance.updateLanguage === 'function') {
        window.builderInstance.updateLanguage(lang, currentTranslations);
    }
    
    const liveRegion = document.getElementById('a11y-live-region');
    if (liveRegion) {
        liveRegion.textContent = currentTranslations.languageChangedAlert || `Language changed to ${lang}.`;
    }
}

export function initializeLanguage() {
    const savedLang = localStorage.getItem('preferredLanguage');
    const browserLang = navigator.language.split('-')[0];

    let langToSet = defaultLang;

    if (savedLang && translations[savedLang]) {
        langToSet = savedLang;
    } else if (translations[browserLang]) {
        langToSet = browserLang;
    }
    
    if (languageSelector) {
        languageSelector.value = langToSet;
    }
    setLanguage(langToSet); // This will also call builderInstance.updateLanguage if available
}

if (languageSelector) {
    languageSelector.addEventListener('change', (event) => {
        setLanguage(event.target.value);
    });
}