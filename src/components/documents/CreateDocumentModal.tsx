import React, { useState } from 'react';
import { Plus, FileText, Folder } from 'lucide-react';
import { Modal, Button, Input } from '../ui';

// 🎓 LEARNING: Create document modal with template options
// This demonstrates modal forms with validation and different creation modes

export interface CreateDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (title: string, template?: string) => Promise<void>;
    loading?: boolean;
}

// Document templates
const DOCUMENT_TEMPLATES = [
    {
        id: 'blank',
        name: 'Blank Document',
        description: 'Start with a clean slate',
        icon: FileText,
        content: {
            type: "doc",
            content: [
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "Start writing here..."
                        }
                    ]
                }
            ]
        }
    },
    {
        id: 'meeting-notes',
        name: 'Meeting Notes',
        description: 'Template for meeting minutes',
        icon: FileText,
        content: {
            type: "doc",
            content: [
                {
                    type: "heading",
                    attrs: { level: 1 },
                    content: [{ type: "text", text: "Meeting Notes" }]
                },
                {
                    type: "paragraph",
                    content: [
                        { type: "text", text: "Date: " },
                        { type: "text", text: new Date().toLocaleDateString(), marks: [{ type: "bold" }] }
                    ]
                },
                {
                    type: "paragraph",
                    content: [{ type: "text", text: "Attendees:" }]
                },
                {
                    type: "bulletList",
                    content: [
                        {
                            type: "listItem",
                            content: [{
                                type: "paragraph",
                                content: [{ type: "text", text: "Name 1" }]
                            }]
                        },
                        {
                            type: "listItem",
                            content: [{
                                type: "paragraph",
                                content: [{ type: "text", text: "Name 2" }]
                            }]
                        }
                    ]
                },
                {
                    type: "heading",
                    attrs: { level: 2 },
                    content: [{ type: "text", text: "Agenda" }]
                },
                {
                    type: "paragraph",
                    content: [{ type: "text", text: "1. Topic 1" }]
                },
                {
                    type: "paragraph",
                    content: [{ type: "text", text: "2. Topic 2" }]
                },
                {
                    type: "heading",
                    attrs: { level: 2 },
                    content: [{ type: "text", text: "Action Items" }]
                },
                {
                    type: "paragraph",
                    content: [{ type: "text", text: "- [ ] Action item 1" }]
                },
                {
                    type: "paragraph",
                    content: [{ type: "text", text: "- [ ] Action item 2" }]
                }
            ]
        }
    },
    {
        id: 'project-plan',
        name: 'Project Plan',
        description: 'Template for project planning',
        icon: Folder,
        content: {
            type: "doc",
            content: [
                {
                    type: "heading",
                    attrs: { level: 1 },
                    content: [{ type: "text", text: "Project Plan" }]
                },
                {
                    type: "heading",
                    attrs: { level: 2 },
                    content: [{ type: "text", text: "Overview" }]
                },
                {
                    type: "paragraph",
                    content: [{ type: "text", text: "Brief description of the project..." }]
                },
                {
                    type: "heading",
                    attrs: { level: 2 },
                    content: [{ type: "text", text: "Objectives" }]
                },
                {
                    type: "orderedList",
                    content: [
                        {
                            type: "listItem",
                            content: [{
                                type: "paragraph",
                                content: [{ type: "text", text: "Objective 1" }]
                            }]
                        },
                        {
                            type: "listItem",
                            content: [{
                                type: "paragraph",
                                content: [{ type: "text", text: "Objective 2" }]
                            }]
                        }
                    ]
                },
                {
                    type: "heading",
                    attrs: { level: 2 },
                    content: [{ type: "text", text: "Timeline" }]
                },
                {
                    type: "paragraph",
                    content: [{ type: "text", text: "Phase 1: Planning (Week 1-2)" }]
                },
                {
                    type: "paragraph",
                    content: [{ type: "text", text: "Phase 2: Development (Week 3-6)" }]
                },
                {
                    type: "paragraph",
                    content: [{ type: "text", text: "Phase 3: Testing (Week 7-8)" }]
                },
                {
                    type: "heading",
                    attrs: { level: 2 },
                    content: [{ type: "text", text: "Resources" }]
                },
                {
                    type: "paragraph",
                    content: [{ type: "text", text: "Team members, tools, budget..." }]
                }
            ]
        }
    }
];

const CreateDocumentModal: React.FC<CreateDocumentModalProps> = ({
    isOpen,
    onClose,
    onCreate,
    loading = false
}) => {
    const [title, setTitle] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState(DOCUMENT_TEMPLATES[0]);
    const [step, setStep] = useState<'template' | 'details'>('template');
    const [error, setError] = useState('');

    // Reset form when modal opens/closes
    React.useEffect(() => {
        if (isOpen) {
            setTitle('');
            setSelectedTemplate(DOCUMENT_TEMPLATES[0]);
            setStep('template');
            setError('');
        }
    }, [isOpen]);

    // Handle template selection
    const handleTemplateSelect = (template: typeof DOCUMENT_TEMPLATES[0]) => {
        setSelectedTemplate(template);
        setStep('details');
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            setError('Document title is required');
            return;
        }

        try {
            await onCreate(title.trim(), selectedTemplate.id);
            onClose();
        } catch (err) {
            setError('Failed to create document. Please try again.');
        }
    };

    // Handle back button
    const handleBack = () => {
        if (step === 'details') {
            setStep('template');
            setError('');
        } else {
            onClose();
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={step === 'template' ? 'Choose a Template' : 'Create Document'}
            size="lg"
        >
            {step === 'template' ? (
                // Template Selection Step
                <div>
                    <p className="text-gray-600 mb-6">
                        Start with a template to get going quickly, or choose a blank document.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {DOCUMENT_TEMPLATES.map((template) => {
                            const Icon = template.icon;
                            return (
                                <button
                                    key={template.id}
                                    onClick={() => handleTemplateSelect(template)}
                                    className={`
                                        p-4 border-2 rounded-lg text-left transition-all hover:border-blue-300 hover:bg-blue-50
                                        ${selectedTemplate.id === template.id
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200'
                                        }
                                    `}
                                >
                                    <Icon className="h-8 w-8 text-blue-600 mb-3" />
                                    <h3 className="font-medium text-gray-900 mb-1">
                                        {template.name}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        {template.description}
                                    </p>
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex justify-end mt-6">
                        <Button onClick={onClose} variant="outline" className="mr-3">
                            Cancel
                        </Button>
                        <Button
                            onClick={() => setStep('details')}
                            disabled={!selectedTemplate}
                        >
                            Continue
                        </Button>
                    </div>
                </div>
            ) : (
                // Document Details Step
                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg mb-4">
                            <selectedTemplate.icon className="h-6 w-6 text-blue-600" />
                            <div>
                                <h3 className="font-medium text-gray-900">
                                    {selectedTemplate.name}
                                </h3>
                                <p className="text-sm text-gray-600">
                                    {selectedTemplate.description}
                                </p>
                            </div>
                        </div>

                        <Input
                            label="Document Title"
                            value={title}
                            onChange={(e) => {
                                setTitle(e.target.value);
                                setError('');
                            }}
                            placeholder="Enter document title..."
                            error={error}
                            autoFocus
                        />
                    </div>

                    <div className="flex justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleBack}
                            disabled={loading}
                        >
                            Back
                        </Button>

                        <div className="space-x-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                loading={loading}
                                disabled={!title.trim()}
                                icon={<Plus />}
                            >
                                Create Document
                            </Button>
                        </div>
                    </div>
                </form>
            )}
        </Modal>
    );
};

export default CreateDocumentModal;
