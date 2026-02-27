const fs = require('fs');
const path = require('path');

try {
    let fixCount = 0;
    function processDir(dir) {
        fs.readdirSync(dir).forEach(file => {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                processDir(fullPath);
            } else if (fullPath.endsWith('.js') && !fullPath.includes('styles.js')) {
                let content = fs.readFileSync(fullPath, 'utf8');
                let original = content;

                // Solid primary check
                content = content.replace(/#3B82F6/gi, '#7C3AED');
                content = content.replace(/59,\s*130,\s*246/g, '124,58,237');

                // Gradient support for inline styles in modules if they exist
                // We'll primarily rely on styles.js for the main UI but modules might have colored borders/buttons

                // Any remaining blue tints
                content = content.replace(/rgba\(59,\s*130,\s*246, ?0\.[0-9]+\)/g, (match) => {
                    return match.replace(/59,\s*130,\s*246/, '124,58,237');
                });

                if (content !== original) {
                    fs.writeFileSync(fullPath, content, 'utf8');
                    fixCount++;
                }
            }
        });
    }

    processDir('c:/Users/ASUS/Downloads/enigma/eg/src');
    console.log('Final purple audit in ' + fixCount + ' files.');
} catch (err) {
    console.error(err);
}
