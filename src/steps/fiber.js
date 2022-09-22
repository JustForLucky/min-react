
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

function createDom(fiber) {
    const dom = fiber.type === TEXT_TYPE ? document.createTextNode('') : document.createElement(fiber.type);

    const isProperty = key => key !== 'children';
    Object.keys(fiber.props)
        .filter(isProperty)
        .forEach(key => {
            dom[key] = fiber.props[key];
        })

    return dom;
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

function performUnitOfWork(fiber) {
    // create DOM
    if (!fiber.dom) {
        fiber.dom = createDom(fiber);
    }

    if (fiber.parent) {
        fiber.parent.dom.appendChild(fiber.dom);
    }

    // create fiber for children
    const elements = fiber.props.children;
    let index = 0;
    let preSibling = null;

    while (index < elements.length) {
        const element = elements[index];
        const newFiber = {
            type: element.type,
            props: element.props,
            parent: fiber,
            dom: null,
        }

        if (index === 0) {
            fiber.child = newFiber;
        } else {
            preSibling.sibling = newFiber;
        }

        preSibling = newFiber;
        index++;
    }

    // return nextUnitOfWork
    if (fiber.child) {
        return fiber.child;
    }

    let nextFiber = fiber;

    while (nextFiber) {
        if (nextFiber.sibling) {
            return nextFiber.sibling;
        }
        nextFiber = nextFiber.parent;
    }

    return nextFiber;
}


/****************** concurrent mode | Fiber **********************/


/****************** render **********************/
function render(element, container) {
    nextUnitOfWork = {
        dom: container,
        props: {
            children: [element]
        }
    }
    // const dom = element.type === TEXT_TYPE ? document.createTextNode('') : document.createElement(element.type);

    // const isProperty = key => key !== 'children';
    // Object.keys(element.props)
    //     .filter(isProperty)
    //     .forEach(key => {
    //         dom[key] = element.props[key];
    //     })

    // element.props.children.forEach(child => {
    //     render(child, dom)
    // })

    // container.appendChild(dom);
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


