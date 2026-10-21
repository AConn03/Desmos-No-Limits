(function () {
    window.Worker = new Proxy(Worker, {
        construct(target, args) {
            const scriptUrl = args[0];
            if (typeof scriptUrl === 'string' && scriptUrl.startsWith("blob:")) {
                try {
                    const xhr = new XMLHttpRequest();
                    xhr.open("GET", scriptUrl, false);
                    xhr.send();
                    if (xhr.status === 200) {
                        let code = xhr.responseText;

                        // Broadened replacements for list and matrix size caps
                        code = code
                            .replace(/>= ? 32768/g, `>= 1e9`)
                            .replace(/1e4/g, `1e9`)
                            .replace(/\b32\b/g, (match, offset, str) => {
                                const snippet = str.substring(Math.max(0, offset - 50), Math.min(str.length, offset + 50));
                                if (
                                    snippet.includes("column") || 
                                    snippet.includes("row") || 
                                    snippet.includes("matrix") || 
                                    snippet.includes("Matrices") ||
                                    snippet.includes("maxMatrixDimen")
                                ) {
                                    return "1000000";
                                }
                                return match;
                            });

                        const blob = new Blob([code], { type: "text/javascript" });
                        args[0] = URL.createObjectURL(blob);
                    }
                } catch (e) {
                    console.error("Failed to patch Desmos worker:", e);
                }
            }
            return new target(...args);
        }
    });
})();