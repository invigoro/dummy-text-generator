enum Language {
    ENGLISH = 'en',
    LATIN = 'la',
    GERMAN = 'de'
}
const generateText = (language: Language) => {
    switch(language) {
        case Language.ENGLISH: return "Sugman balls"
        case Language.LATIN: return "Lorem Ipsum"
        case Language.GERMAN: return "Grosse schwanz"
    }
};

export {
    Language,
    generateText
};