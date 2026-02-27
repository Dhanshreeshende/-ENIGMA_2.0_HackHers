const fs = require('fs');
const path = require('path');

try {
    console.log('Starting execution...');
    function processDir(dir) {
        fs.readdirSync(dir).forEach(file => {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                processDir(fullPath);
            } else if (fullPath.endsWith('.js') && !fullPath.includes('styles.js')) {
                let content = fs.readFileSync(fullPath, 'utf8');
                let original = content;

                // Colors
                content = content.replace(/#00ffb4/gi, '#0D8601');
                content = content.replace(/0,\s*255,\s*180/g, '13,134,1');
                content = content.replace(/#050e1a/gi, '#F7F9FC');
                content = content.replace(/#03070f/gi, '#FFFFFF');
                content = content.replace(/#071828/gi, '#FFFFFF');
                content = content.replace(/5,\s*12,\s*22/g, '255,255,255');
                content = content.replace(/#c8e6f5/gi, '#111827');
                content = content.replace(/200,\s*230,\s*245/g, '107,114,128'); // Text dim to gray
                content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.0/g, 'rgba(0,0,0,0.0'); // Invert white semi-transparent to black semi-trans on light bg

                // Typography
                content = content.replace(/Orbitron/gi, 'Inter');
                content = content.replace(/'Space Mono',?\s*(?:'Courier New',?)?\s*(?:monospace)?/g, "\"'Inter', sans-serif\"");
                content = content.replace(/\"Space Mono\"/gi, '\"Inter, sans-serif\"');
                content = content.replace(/Space Mono/gi, 'Inter');

                if (content !== original) {
                    fs.writeFileSync(fullPath, content, 'utf8');
                    console.log('Updated', fullPath);
                }
            }
        });
    }

    processDir('c:/Users/ASUS/Downloads/enigma/eg/src');
    console.log('Mass replacement complete.');
} catch (err) {
    console.error('ERROR:', err);
}
