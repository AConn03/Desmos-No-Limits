(function() {
    window.Worker = new Proxy(Worker, {
        construct(target, args) {
            if (typeof args[0] === 'string' && args[0].startsWith("blob:")) {
                try {
                    const xhr = new XMLHttpRequest();
                    xhr.open("GET", args[0], false);
                    xhr.send();
                    if (xhr.status === 200) {
                        let workerCode = xhr.responseText;
                        workerCode = workerCode
                            .replace(/>= ? 32768/g, `>= 1e9`)
                            .replace(/1e4/g, `1e9`);
                        workerCode = workerCode
                            .replace(/32/g, (match, offset, str) => {
                                const snippet = str.substring(Math.max(0, offset - 50), Math.min(str.length, offset + 50));
                                if (snippet.includes("column") || snippet.includes("row") || snippet.includes("matrix") || snippet.includes("Matrices")) {
                                    return "1e6";
                                }
                                return match;
                            });
                        const modifiedBlob = new Blob([workerCode], { type: "text/javascript" });
                        args[0] = URL.createObjectURL(modifiedBlob);
                    }
                } catch (e) {
                    console.error("Failed to patch Desmos worker:", e);
                }
            }
            return new target(...args);
        }
    });
})();