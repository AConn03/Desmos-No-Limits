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

                        const rules = [
                            { re: />\s*1e4\s*\]?\s*\)\s*throw\s+(?:Um\(\)|ErrorMsg\.maxListSize\(\))/g, rep: m => m.replace("1e4", "1e9") },
                            { re: /\bsT\s*=\s*\[?1e4\]?/g, rep: m => m.replace("1e4", "1e9") },
                            { re: /(canUse(?:Restriction|Color|List)WithCost\s*\([^)]*\)\s*\{\s*return\s*[^;]*?<=\s*)(?:\[?1e4\]?)/g, rep: m => m.replace("1e4", "1e9") },
                            { re: /\bdefaultLimit\s*=\s*1e[45]\b/g, rep: m => m.replace(/1e[45]/, "1e9") },
                            { re: /\$\{[^}]*\}\s*>\s*\$\{\[?1e4\]?\}\s*\)\s*throw\s+ErrorMsg\.maxListSize\(\)/g, rep: m => m.replace("1e4", "1e9") },
                            { re: /\bmaxMatrixDimen\s*:\s*\[?32\]?/g, rep: "maxMatrixDimen:1e6" },
                            { re: /\.length\s*>\s*\[?32\]?\s*\)\s*throw\s+(?:Nb\(\)|HE\(\)|zE\(\))/g, rep: m => m.replace(/\b32\b/, "1e6") },
                        ];

                        for (const r of rules) {
                            code = code.replace(r.re, m => typeof r.rep === 'function' ? r.rep(m) : r.rep);
                        }

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