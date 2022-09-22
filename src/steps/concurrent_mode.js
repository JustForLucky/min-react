
/****************** DOM **********************/

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
/****************** DOM **********************/

/****************** concurrent mode | Fiber **********************/

let nextUnitOfWork = null;

function workLoop(deadline) {
    let shouldYield = false;

    while (nextUnitOfWork && !shouldYield) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
        shouldYield = deadline < 1;
    }

    requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop)

function performUnitOfWork(nextUnitOfWork) {

}


/****************** concurrent mode | Fiber **********************/


/****************** render **********************/
function render(element, container) {
    const dom = element.type === TEXT_TYPE ? document.createTextNode('') : document.createElement(element.type);

    const isProperty = key => key !== 'children';
    Object.keys(element.props)
        .filter(isProperty)
        .forEach(key => {
            dom[key] = element.props[key];
        })

    element.props.children.forEach(child => {
        render(child, dom)
    })

    container.appendChild(dom);
}
/****************** render **********************/

const Didact = {
    createElement,
    render,
}

/** @jsxRuntime classic */
/** @jsx Didact.createElement */
const App = <h1 id="title">测试</h1>

const container = document.getElementById('root');
render(App, container);


