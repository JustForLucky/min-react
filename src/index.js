/**
 * 1. createElement ✅
 * 2. render ✅
 * 3. Concurrent Mode ✅ 解决问题：当element tree过大，会导致递归执行时间过长，且浏览器无法打断，进而可能导致页面有卡顿感
 * 4. Fibers ✅ 解决问题：使用workLoop，按照unitOfWork的方式执行，来实现concurrent mode
 * 5. Render and Commit Phases ✅ 解决问题：unitOfWork的执行时间歇性的，可能会导致UI渲染不完全，因此需要进行逻辑分离，按照unitOfWork找出所有需要更新的DOM，
 * 然后一次性render更新，最终的render过程不可被中断
 * 6. Reconciliation ✅
 * 7. Function Components ✅
 * 8. Hooks
 */


/**
 * Fiber {
 *  type -> string | Function
 *  dom -> 
 *  props ->
 *  parent ->
 *  child -> 
 *  sibling -> 
 * }
 * parent | child | sibling -> 用于定位下一个nextUnitOfWork，优先级： child > sibling > parent.sibling，对标树结构的深度优先遍历
 * TODO: 问题延伸，为什么选择深度优先遍历而不是广度优先遍历？
 */

// 常量
const TextElementType = 'TEXT_ELEMENT';
const EffectTag = {
  UPDATE: 'UPDATE',
  PLACEMENT: 'PLACEMENT',
  DELETION: 'DELETION'
}

/** key相关判断 */
const isEvent = key => key.startsWith('on');
const isProperty = key => key !== 'children' && !isEvent(key);
const isNew = (prev, next) => key => prev[key] !== next[key];
const isGone = (prev, next) => key => !(key in next);

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
    type: TextElementType,
    props: {
      nodeValue: text,
      children: []
    }
  }
}

function createDOM(fiber) {
  // create dom node
  const dom = fiber.type === TextElementType ? document.createTextNode("") : document.createElement(fiber.type);

  updateDOM(dom, {}, fiber.props)

  return dom;
}

function updateDOM(dom, prevProps, nextProps) {
  // remove old or changed events
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(key => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach(name => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    })

  // set new or changed events
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    })

  // remove old properties
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach(name => {
      dom[name] = ""
    })

  // set new or changed properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      dom[name] = nextProps[name];
    })

}


function commitRoot() {
  deletions.forEach(commitWork)
  commitWork(wipRoot.child)
  currentRoot = wipRoot
  wipRoot = null
}

function commitWork(fiber) {
  if (!fiber) return;
  // const domParent = fiber.parent.dom;
  let domParentFiber = fiber.parent
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent
  }
  const domParent = domParentFiber.dom
  if (fiber.effectTag === EffectTag.PLACEMENT && fiber.dom !== null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === EffectTag.UPDATE && fiber.dom !== null) {
    updateDOM(
      fiber.dom,
      fiber.alternate.props,
      fiber.props
    )
  }
  else if (fiber.effectTag === EffectTag.DELETION) {
    // domParent.removeChild(fiber.dom)
    commitDeletion(fiber, domParent)
  }
  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom)
  } else {
    commitDeletion(fiber.child, domParent)
  }
}


function render(element, container) {
  /**
   * work in progress
   */
  wipRoot = {
    dom: container,
    props: {
      children: [element]
    },
    alternate: currentRoot
  }
  nextUnitOfWork = wipRoot
  deletions = []
  // 处理children
  // element.props.children.forEach(child => render(child, dom))

  // container.appendChild(dom);
}


/** concurrent mode */
let nextUnitOfWork = null
let currentRoot = null
let wipRoot = null
let deletions = null

function workLoop(deadline) {
  let shouldYield = false
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
    shouldYield = deadline.timeRemaining() < 1;
  }
  /** unitOfWork 执行完成 */
  if (wipRoot && !nextUnitOfWork) {
    /** 不可打断执行 */
    commitRoot();
  }
  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop)

function performUnitOfWork(fiber) {
  if (fiber.type instanceof Function) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }
  // let index = 0;
  // let preSibling = null;

  // while( index < elements.length) {
  //   const element = elements[index];
  //   const newFiber = {
  //     type: element.type,
  //     props: element.props,
  //     parent: fiber,
  //     dom: null
  //   }
  //   if (index === 0) {
  //     fiber.child = newFiber;
  //   } else {
  //     preSibling.sibling = newFiber;
  //   }
  //   preSibling = newFiber;
  //   index++;
  // }
  // return the next unit of work
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
}

let wipFiber = null;
let hookIndex = null;
function updateFunctionComponent(fiber) {
  wipFiber = fiber
  hookIndex = 0
  wipFiber.hooks = []
  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
}

function updateHostComponent(fiber) {
  // add the element to the DOM
  if (!fiber.dom) {
    fiber.dom = createDOM(fiber)
  }
  // remove update dom immediately
  const elements = fiber.props.children;
  reconcileChildren(fiber, elements);
}

/**
 * 对比新/旧fiber
 * @param {*} wipFiber 
 * @param {*} elements 
 */
function reconcileChildren(wipFiber, elements) {
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null;
  while (
    index < elements.length ||
    oldFiber != null
  ) {
    const element = elements[index];
    let newFiber = null

    const isSameType = oldFiber && element && oldFiber.type === element.type;

    if (isSameType) {
      // 更新
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: EffectTag.UPDATE
      }
    }

    if (element && !isSameType) {
      // 替换
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: EffectTag.PLACEMENT
      }
    }

    if (oldFiber && !isSameType) {
      // 删除
      oldFiber.effectTag = EffectTag.DELETION
      deletions.push(oldFiber)
    }


    /**
     * note: elements来源于children
     * 因此对比是children的横向对比,所以oldFiber也是跟着sibling移动
     */
    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }
    if (index === 0) {
      wipFiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }
    prevSibling = newFiber;
    index++;
  }

}

function useState(initial) {
  const oldHook = wipFiber.alternate && wipFiber.alternate.hooks && wipFiber.alternate.hooks[hookIndex];
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: []
  }

  const actions = oldHook ? oldHook.queue : []
  actions.forEach(action => {
    hook.state = action(hook.state)
  })

  const setState = (action) => {
    hook.queue.push(action);
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot,
    }
    /** 通过nextUnitOfWork控制执行流 */
    nextUnitOfWork = wipRoot
    deletions = []
  }

  wipFiber.hooks.push(hook);
  hookIndex++;
  return [hook.state, setState]
}

const Didact = {
  createElement,
  render,
  useState,
}

// /** @jsxRuntime classic */
// /** @jsx Didact.createElement */
// const element = (<h1 title="test">Hello World!</h1>)
// const container = document.getElementById('root');

// Didact.render(element, container);


/** @jsxRuntime classic */
/** @jsx Didact.createElement */
function Age(props) {
  return <h2>age: {props.age}</h2>
}
function App(props) {
  return <div>
    <h1>Hi {props.name}</h1>
    <Age age={30} />
  </div>
}

function Counter() {
  const [count, setCount] = Didact.useState(0);
  return (
    <div>
      <p>currentCount: {count}</p>
      <button onClick={e => {
        console.log('click')
        setCount(c => c+1)
      }}>add Count</button>
    </div>
  )
}

const element = <Counter />
const container = document.getElementById("root")

Didact.render(element, container)

// const updateValue = e => {
//   rerender(e.target.value)
// }

// const rerender = value => {
//   const element = (
//     <div>
//       <input onInput={updateValue} value={value} />
//       <h2>Hello {value}</h2>
//     </div>
//   )
//   Didact.render(element, container)
// }

// rerender("World")

// const root = ReactDOM.createRoot(document.getElementById('root'));
// root.render(element);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
