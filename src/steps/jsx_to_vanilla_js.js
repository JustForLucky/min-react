const elements = {
    type: 'h1',
    props: {
        id: 'title',
        children: '标题'
    }
}

const container = document.getElementById('root');

const node = document.createElement(elements.type);
node['id'] = elements.props.id;

const textNode = document.createTextNode('');
textNode.nodeValue = elements.props.children;

node.appendChild(textNode);
container?.appendChild(node);