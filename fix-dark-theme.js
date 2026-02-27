const fs = require('fs');
const path = require('path');

try {
    let fixCount = 0;
    function processDir(dir) {
        fs.readdirSync(dir).forEach(file => {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                processDir(fullPath);
            } else if (fullPath.endsWith('.js') && !fullPath.includes('styles.js') && !fullPath.includes('MLComparisonPanel.js')) {
                let content = fs.readFileSync(fullPath, 'utf8');
                let original = content;

                // Priority fixes (catch the weird buggy ones first)
                content = content.replace(/#111827fff/gi, '#020617');
                content = content.replace(/rgba\(0,0,0,0\.0/g, 'rgba(255,255,255,0.0'); // revert black glare back to white glare

                // Primary Blue 
                content = content.replace(/#0D8601/gi, '#3B82F6');
                content = content.replace(/13,\s*134,\s*1/g, '59,130,246');

                // Backgrounds
                content = content.replace(/#FFFFFF/gi, '#020617'); // Main bg
                content = content.replace(/#F7F9FC/gi, '#111827'); // Card/Surface

                // Text
                content = content.replace(/#111827/gi, '#E5E7EB'); // Dark text back to light (primary text)
                content = content.replace(/17,\s*24,\s*39/g, '255,255,255'); // inverted lines back to white

                content = content.replace(/#6B7280/gi, '#9CA3AF'); // Secondary text
                content = content.replace(/107,\s*114,\s*128/g, '156,163,175'); // muted text rgb

                // Borders
                content = content.replace(/#E5E7EB/gi, '#1F2937'); // Borders to dark

                if (content !== original) {
                    fs.writeFileSync(fullPath, content, 'utf8');
                    fixCount++;
                }
            }
        });
    }

    processDir('c:/Users/ASUS/Downloads/enigma/eg/src');
    console.log('Fixed themes in ' + fixCount + ' files.');
} catch (err) {
    console.error(err);
}
