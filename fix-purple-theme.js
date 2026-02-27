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

                content = content.replace(/#3B82F6/gi, '#7C3AED');
                content = content.replace(/59,\s*130,\s*246/g, '124,58,237');
                content = content.replace(/59,130,246/g, '124,58,237');

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
