import { zip } from "./Utils";
let last=null
    function screenShot(ws) {
            // 1. Rewrite current doc's imgs, css, and script URLs to be absolute before
            // we duplicate. This ensures no broken links when viewing the duplicate.
            //urlsToAbsolute(document.images);
            //urlsToAbsolute(document.querySelectorAll("link[rel='stylesheet']"));
            //urlsToAbsolute(document.scripts);
          
            // 2. Duplicate entire document tree.
            var screenshot = document.documentElement.cloneNode(true);
          
            // 3. Screenshot should be readyonly, no scrolling, and no selections.
            screenshot.style.pointerEvents = 'none';
            screenshot.style.overflow = 'hidden';
            screenshot.style.userSelect = 'none'; // Note: need vendor prefixes
          
            // 4. ... read on ...
          
            // 5. Create a new .html file from the cloned content.
            const blob = new Blob([screenshot.outerHTML], {type: 'text/html'});
            //console.log('screenShot',blob.size,blob.type)
            blob.text().then(t=>{
                let i=0,j=0
                if (!last) last=t
                else {
                    while (i<last.length && i<t.length && t.charAt(i)===last.charAt(i)) i++
                    while (j<last.length && j<t.length && t.charAt(t.length-j)===last.charAt(last.length-j)) j++
                    last=t
                }
                const z=zip({screenShot:t.substring(i,blob.size-j+1),start:i,end:j})
                console.log('screenShot',blob.size,blob.type,z.length,blob.size-i-j)
                if (ws) ws.send({screen:z})
                //const w=window.open(window.URL.createObjectURL(blob),'copy')
            })
            // Open a popup to new file by creating a blob URL.
            // window.open(window.URL.createObjectURL(blob));
          }
export {screenShot}