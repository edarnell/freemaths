import React from 'react'
import 'bootswatch/dist/cerulean/bootstrap.min.css'
import { FreeMaths } from './FreeMaths'
import * as serviceWorker from './serviceWorker'
import { createRoot } from 'react-dom/client'
const root = document.getElementById('root')
const container = createRoot(root)
container.render(<FreeMaths />)


/*container.render(<React.StrictMode>
    {w ? < Window w={w} /> : <FreeMaths />}
</React.StrictMode>)
*/
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
export { root }
