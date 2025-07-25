import 'dotenv/config';
import * as fs from 'fs';

async function main() {
    const input = await new Promise((resolve, reject) => {
        fs.readFile("text/batman.txt", (err, t) => {
            if (err) {
                reject(err);
                return;
            }

            const text = t.toString("utf-8");
            const paragraphs = text.split(/\n\n/g);
            resolve(paragraphs);
        });
    });


}

main().catch(console.error);
