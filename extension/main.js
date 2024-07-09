import { maths } from '/maths.js'
import { debug } from '/Utils.js'
import { maths_keys } from '/is.js'
import katex from '/katex.js'

function mathsSymbols(value, selectionStart) {
    var l = value.length
    if (value.indexOf('begin') === -1) Object.keys(maths_keys).forEach(c => { value = value.replace(maths_keys[c], c, value) })
    //value = value.replace('!=','≠',value); now \= to allow for factorial
    //value = value.replace('=~','≈',value);
    value = value.replace('/dx', '/(dx)', value);
    value = value.replace('/du', '/(du)', value);
    value = value.replace('/Δx', '/(Δx)', value);
    if (selectionStart) var caret = selectionStart + value.length - l
    else caret = null
    //console.log("mathsSymbols",l,value.length,caret)
    return { text: value, caret: caret }
}

let mI = document.getElementById("mathsInput")
let mT = document.getElementById("mathsText")
console.log('started')

mI.addEventListener("input", e => {
    const m_ = e === null ? { text: '' } : mathsSymbols(e.target.value, mI.selectionStart)
    mI.value = m_.text
    if (m_.caret) mI.setSelectionRange(m_.caret, m_.caret)
    const v = {}, m = maths(e.target.value, v, true)
    let t = ''
    if (m && m[0]) m.forEach(k => {
        if (k.type === 'maths' || k.type === 'latex') t += '<span class="katex">' + katex.renderToString(k.chunk) + '</span>'
        else if (k.type === 'html') t += k.chunk
    })
    mT.innerHTML = t
    debug('mI', true)({ t })
});