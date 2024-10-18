export const getWords = (text: string) => {
    return text.split(" ");
}

export const getParagraphs = (text:string) => {
    return text.split(/\r?\n/)
}

export const getSentences = (text:string) => {
    return text.match( /[^\.!\?]+[\.!\?]+/g );
}