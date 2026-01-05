
import React, { useState, useCallback, useRef } from 'react';
import {
    ReactFlow,
    ReactFlowProvider,
    addEdge,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    Connection,
    Edge,
    Node,
    Panel,
    useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Initial Graph
const initialNodes: Node[] = [
    {
        id: 'trigger',
        type: 'input', // or custom 'trigger'
        data: { label: 'Trigger: Order Created' },
        position: { x: 250, y: 5 },
    },
];

let id = 0;
const getId = () => `dndnode_${id++}`;

interface ControlsProps {
    onSave: (nodes: Node[], edges: Edge[]) => void;
    onCancel: () => void;
}

const FlowControls: React.FC<ControlsProps> = ({ onSave, onCancel }) => {
    const { getNodes, getEdges } = useReactFlow();

    return (
        <div className="flex gap-2">
            <button
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={onCancel}
            >
                Cancel
            </button>
            <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => onSave(getNodes(), getEdges())}
            >
                Save Automation
            </button>
        </div>
    );
};

interface Props {
    initialFlow?: { nodes: Node[], edges: Edge[] };
    onSave: (flow: { nodes: Node[], edges: Edge[] }) => void;
    onCancel: () => void;
}

const FlowBuilderContent: React.FC<Props> = ({ initialFlow, onSave, onCancel }) => {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialFlow?.nodes || initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialFlow?.edges || []);
    const { screenToFlowPosition } = useReactFlow();

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');
            const label = event.dataTransfer.getData('application/label');

            if (typeof type === 'undefined' || !type) {
                return;
            }

            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode: Node = {
                id: getId(),
                type: type === 'trigger' ? 'input' : (type === 'action' ? 'default' : 'output'), // mapping for prototype
                position,
                data: { label: label || `${type} node` },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [screenToFlowPosition, setNodes],
    );

    return (
        <div className="flex h-full w-full">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-50 border-r p-4 flex flex-col gap-4">
                <div className="font-bold border-b pb-2 mb-2">Toolbox</div>
                <p className="text-sm text-gray-500 mb-2">Drag nodes to the canvas</p>

                <div
                    className="p-3 bg-white border rounded cursor-grab shadow-sm"
                    onDragStart={(event) => {
                        event.dataTransfer.setData('application/reactflow', 'action');
                        event.dataTransfer.setData('application/label', 'Send Email');
                        event.dataTransfer.effectAllowed = 'move';
                    }}
                    draggable
                >
                    ✉️ Send Email
                </div>
                <div
                    className="p-3 bg-white border rounded cursor-grab shadow-sm"
                    onDragStart={(event) => {
                        event.dataTransfer.setData('application/reactflow', 'delay');
                        event.dataTransfer.setData('application/label', 'Wait 1 Hour');
                        event.dataTransfer.effectAllowed = 'move';
                    }}
                    draggable
                >
                    ⏱️ Delay
                </div>
                <div
                    className="p-3 bg-white border rounded cursor-grab shadow-sm"
                    onDragStart={(event) => {
                        event.dataTransfer.setData('application/reactflow', 'condition');
                        event.dataTransfer.setData('application/label', 'Check Condition');
                        event.dataTransfer.effectAllowed = 'move';
                    }}
                    draggable
                >
                    ❓ Condition
                </div>
            </aside>

            {/* Canvas */}
            <div className="flex-1 h-full" ref={reactFlowWrapper}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    fitView
                >
                    <Controls />
                    <Background />
                    <Panel position="top-right">
                        <FlowControls
                            onSave={(n, e) => onSave({ nodes: n, edges: e })}
                            onCancel={onCancel}
                        />
                    </Panel>
                </ReactFlow>
            </div>
        </div>
    );
};

export const FlowBuilder: React.FC<Props> = (props) => {
    return (
        <ReactFlowProvider>
            <FlowBuilderContent {...props} />
        </ReactFlowProvider>
    );
};
