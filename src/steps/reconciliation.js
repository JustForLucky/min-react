const TEXT_TYPE = "TEXT_ELEMENT";
const EffectTag = {
    UPDATE: 'UPDATE',
    REPLACEMENT: 'REPLACEMENT',
    DELETION: 'DELETION'
}


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
    const dom = fiber.type === TEXT_TYPE ? document.createTextNode("") : document.createElement(fiber.type);

    // const isProperty = key => key !== 'children';
    // Object.keys(fiber.props)
    //     .filter(isProperty)
    //     .forEach(key => {
    //         dom[key] = fiber.props[key]
    //     })
    updateDom(dom, {}, fiber.props);

    return dom;
}

const isEvent = key => key.startsWith("on");
const isProperty = key => key !== 'children' && !isEvent(key);
const isNew = (prev, next) => key => prev[key] !== next[key];
const isGone = (prev, next) => key => !(key in next);

function updateDom(dom, prevProps, nextProps) {
    // Remove old or changed event listeners
    Object.keys(prevProps)
        .filter(isEvent)
        .filter(key => !(key in nextProps) || isNew(prevProps, nextProps)(key))
        .forEach(name => {
            const eventType = name.toLowerCase().substring(2)
            dom.removeEventListener(eventType, prevProps(name))
        })

    // Remove old properties
    Object.keys(prevProps)
        .filter(isProperty)
        .filter(isGone(prevProps, nextProps))
        .forEach(name => {
            dom[name] = ""
        })

    // Set new or changed properties
    Object.keys(nextProps)
        .filter(isProperty)
        .filter(isNew(prevProps, nextProps))
        .forEach(name => {
            dom[name] = nextProps[name]
        })

    // Add event listener
    Object.keys(nextProps)
        .filter(isEvent)
        .filter(isNew(prevProps, nextProps))
        .forEach(name => {
            const eventType = name.toLowerCase().substring(2);
            dom.addEventListener(eventType, nextProps[name])
        })
}

function commitRoot() {
    deletions.forEach(commitWork)
    commitWork(wipRoot.child);
    currentRoot = wipRoot;
    wipRoot = null;
}

function commitWork(fiber) {
    if (!fiber) {
        return;
    }
    const domParent = fiber.parent.dom;
    if (fiber.effectTag === EffectTag.REPLACEMENT && fiber.dom != null) {
        domParent.appendChild(fiber.dom);
    } else if (fiber.effectTag === EffectTag.UPDATE && fiber.dom !== null) {
        updateDom(
            fiber.dom,
            fiber.alternate.props,
            fiber.props
        )
    } else if (fiber.effectTag === EffectTag.DELETION) {
        domParent.removeChild(fiber.dom);
    }
    commitWork(fiber.child);
    commitWork(fiber.sibling);
}

let nextUnitOfWork = null;
let currentRoot = null;
let wipRoot = null;
let deletions = null;


function workLoop(deadline) {
    let shouldYield = false;

    while (nextUnitOfWork && !shouldYield) {
        nextUnitOfWork = performWork(nextUnitOfWork);
        shouldYield = deadline < 1;
    }

    if (!nextUnitOfWork && wipRoot) {
        commitRoot();
    }

    requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop)

function performWork(fiber) {
    if (!fiber.dom) {
        fiber.dom = createDom(fiber)
    }
    const elements = fiber.props.children;
    reconcileChildren(fiber, elements)
    // let index = 0;
    // let preSibling = null;

    // while (index < elements.length) {
    //     const element = elements[index];
    //     const newFiber = {
    //         type: element.type,
    //         props: element.props,
    //         parent: fiber,
    //         dom: null,
    //     }

    //     if (index === 0) {
    //         fiber.child = newFiber;
    //     } else {
    //         preSibling.sibling = newFiber;
    //     }

    //     preSibling = newFiber;
    //     index++;
    // }

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

function reconcileChildren(wipFiber, elements) {
    let index = 0;
    let preSibling = null;
    let oldFiber = wipFiber.alternate && wipFiber.alternate.child;

    while (index < elements.length || oldFiber !== null) {
        const element = elements[index];
        let newFiber = null;

        const sameType = element && oldFiber && (element.type == oldFiber.type);

        if (sameType) {
            // save dom node and update props
            newFiber = {
                type: oldFiber.type,
                props: element.props,
                dom: oldFiber.dom,
                parent: wipFiber,
                alternate: oldFiber,
                effectTag: EffectTag.UPDATE
            }
        }

        if (element && !sameType) {
            // create dom
            newFiber = {
                type: element.type,
                props: element.props,
                parent: wipFiber,
                dom: null,
                alternate: null,
                effectTag: EffectTag.REPLACEMENT
            }
        }

        if (oldFiber && !sameType) {
            // delete old dom node
            oldFiber.effectTag = EffectTag.DELETION;
            deletions.push(oldFiber);
        }

        if (oldFiber) {
            oldFiber = oldFiber.alternate;
        }

        if (index === 0) {
            wipFiber.child = newFiber;
        } else {
            preSibling.sibling = newFiber;
        }

        preSibling = newFiber;
        index++;
    }
}


function render(element, container) {
    wipRoot = {
        dom: container,
        props: {
            children: [element]
        },
        alternate: currentRoot
    }
    deletions = []
    nextUnitOfWork = wipRoot;
}

const Didact = {
    createElement,
    render,
}

/** @jsxRuntime classic */
/** @jsx Didact.createElement */
const App = <h1 id="title">测试</h1>

const container = document.getElementById('root');
Didact.render(App, container);


