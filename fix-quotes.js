const fs = require('fs');
const path = require('path');

try {
    let fixCount = 0;
    function processDir(dir) {
        fs.readdirSync(dir).forEach(file => {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                processDir(fullPath);
            } else if (fullPath.endsWith('.js')) {
                let content = fs.readFileSync(fullPath, 'utf8');
                let original = content;

                // Fix double double quotes e.g. ""Inter, sans-serif"" or ""'Inter', sans-serif""
                content = content.replace(/""'Inter', sans-serif""/g, '"Inter, sans-serif"');
                content = content.replace(/""Inter, sans-serif""/g, '"Inter, sans-serif"');
                content = content.replace(/"'Inter', sans-serif"/g, '"Inter, sans-serif"');

                // There might be quotes inside template literals like `""Inter""`
                content = content.replace(/""Inter""/g, '"Inter"');

                if (content !== original) {
                    fs.writeFileSync(fullPath, content, 'utf8');
                    fixCount++;
                }
            }
        });
    }

    processDir('c:/Users/ASUS/Downloads/enigma/eg/src');
    console.log('Fixed syntax errors in ' + fixCount + ' files.');
} catch (err) {
    console.error(err);
}
