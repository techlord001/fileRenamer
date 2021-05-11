/* 
 **
 *  fileRenamer
 *  
 *  This app is designed to rename media files to conform to certain standards
 *  and to maximise organisation of said files.
 *  Requiring several inputs from the user, and using web-scraping, files
 *  are renamed occording to the parameters that have been set.
 **  
 *  User initialises the program via the CLI
 *  Prompted to provide 4 criteria:
 *  @param {string} dir - The absolute path of the directory
 *  @param {string} format - The format of the files, i.e their file extension
 *  @param {string} url - Corresponding URL Wikipedia page
 *  @param {bool} engage - Confirmation to execute
 */

const fs = require('fs');
const readlineSync = require('readline-sync');
const rp = require('request-promise');
const path = require('path');
const { exit } = require('process');
const $ = require('cheerio');

// List of formats
const formats = ['.mkv', '.mp4'];

// Retrieve input from user
let dir = readlineSync.questionPath('Directory: ', {
    exists: true,
    isDirectory: true
});
let formatIndex = readlineSync.keyInSelect(formats, 'Format: ');
let url = readlineSync.question('Wikipedia page: ');
let engage = readlineSync.keyInYNStrict('Confirm? ');

// Only execute code after confirmation
if (!engage) {
    exit();
} else {
    // Assign format
    let format = formats[formatIndex];
    // Check if titles are needed
    if (!url) {
        changeName(dir, format);
    } else {
        // Grab titles from Wikipedia
        rp(url)
            .then(html => {
                // Array to hold titles
                const titles = [];
                // Find each title, removing incompatible punctuation and capitalising each word
                $('td.summary', html).each(function(i, elem) {
                    titles[i] = $(this)
                                    .text()
                                    .replace(/\"|\`|\?|\*|\:/g, '')
                                    .replace(/\w\S*/g, function(txt) {
                                        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                                    });
                });
                // Call changeName function
                changeName(dir, format, titles);
            })
            .catch(err => {
                console.error(err);
            });
    }
}

// Change the name of the files
function changeName(dir, format, titles) {
    // Get list of files
    fs.readdir(dir, (err, files) => {
        if (err) {
            throw err;
        }
        // Counter for file numbering
        let i = 1;
        // Check if titles were included
        if (!titles) {
            // Loop through files
            files.forEach(file => {
                // Only change files of correct file type
                if (path.extname(file) !== format) {
                    return null;
                } else {
                    // Change name
                    fs.renameSync(`${dir}/${path.basename(file)}`, `${dir}/Episode ${i + format}`);
                    i++;
                }
            });
        } else {
            // Loop through files
            files.forEach(file => {
                // Only change files of correct file type
                if (path.extname(file) !== format) {
                    return null;
                } else {
                    // Change name
                    fs.renameSync(`${dir}/${path.basename(file)}`, `${dir}/Episode ${i} - ${titles[i - 1] + format}`);
                    i++;
                }
            });
        }
    });
}