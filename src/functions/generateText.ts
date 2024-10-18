enum Language {
    ENGLISH = 'en',
    LATIN = 'la',
    GERMAN = 'de'
}

enum Jumble {
    NONE,
    PARAGRAPH,
    SENTENCE,
    WORD
}

const generateText = (language: Language) => {
    switch(language) {
        case Language.ENGLISH: return "Sugma balls"
        case Language.LATIN: return "Lorem Ipsum"
        case Language.GERMAN: return "Grosse schwanz"
    }
};

export {
    Language,
    Jumble,
    generateText
};