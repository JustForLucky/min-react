
const TEXT_TYPE = "TEXT_ELEMENT";

function createElement(type, props, ...children) {
    return {
        type,
        props: {
            ...props,
            children: children.map(child => typeof child === 'object' ? child : createTextElement(child))
        }
    }
}

function createTextElement(text) {
    return {
        type: TEXT_TYPE,
        props: {
            nodeValue: text,
            children: []
        }
    }
}


function render(elements, container) {
    
}

const Didact = {
    createElement,
}

/** @jsxRuntime classic */
/** @jsx Didact.createElement */
const App = <h1>测试</h1>

const container = document.getElementById('root');


