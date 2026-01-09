import { useState } from 'react';
import GreetingEditor from './components/GreetingEditor';
import GreetingEditorModal from './components/GreetingEditorModal';
import './App.css';

type EditorMode = 'inline' | 'modal';

function App() {
  const [editorMode, setEditorMode] = useState<EditorMode>('inline');

  const handleUpdate = (updatedComponents: any[]) => {
    console.log('Updated components:', updatedComponents);
  };

  return (
    <div className="app">
      {/* 상단 툴바 */}
      <div className="toolbar">
        <h1>Greeting Editor</h1>
        <div className="toolbar-actions">
          {/* 에디터 모드 토글 */}
          <div className="mode-toggle">
            <button
              onClick={() => setEditorMode('inline')}
              className={`mode-btn ${editorMode === 'inline' ? 'active' : ''}`}
            >
              인라인
            </button>
            <button
              onClick={() => setEditorMode('modal')}
              className={`mode-btn ${editorMode === 'modal' ? 'active' : ''}`}
            >
              모달
            </button>
          </div>
        </div>
      </div>

      {/* 에디터 영역 */}
      {editorMode === 'inline' ? (
        <GreetingEditor onUpdate={handleUpdate} />
      ) : (
        <GreetingEditorModal onUpdate={handleUpdate} />
      )}
    </div>
  );
}

export default App;
