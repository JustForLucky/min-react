# 构建React逻辑梳理

Step 1 createElement
解决问题：JSX -> JS 

Step 2 render
将Element转换为真实的DOM NODE，并更新

Step 3 Concurrent Mode
若element tree过于庞大，会带来执行时间过长，导致浏览器无法执行更高优先级的任务，如用户输入、保持动画丝滑等。
解决方案：利用requestIdleCallback，分段执行render

Step 4 Fibers
增加Fiber结构，来实现Concurrent Mode
Fiber <-> Element
{
    type: string | Function,
    props: { [key: string]: any },
    dom: DOM | null,
    parent: Fiber | null,
    child: Fiber | null,
    sibling: Fiber | null,
    alternate: Fiber | null,
}
parent | child | sibling -> 找寻下一个unitOfWork，优先级child > sibling > parent.sibling，对标「深度优先】

Step 5 Render and Commit Phased
分段执行dom更新，会导致未渲染完成的UI呈现给用户
因此将performUnitOfWork分段：commit -> 提交更新，可分段执行；render -> 更新dom，不可打断

Step 6 Reconcilation
对比wipRoot和currentRoot，确定需要更新的Fiber

Step 7 Function Components

Step 8 Hooks