export const useEditorStats = () => {
    const getWordCount = (text: string): number => {
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }

    const getReadingTime = (wordCount: number): number => {
        return Math.ceil(wordCount / 200);
    }

    const getCharCount = (text: string) => {
        return text.length;
    }

    return {
        getWordCount,
        getReadingTime,
        getCharCount
    };
}