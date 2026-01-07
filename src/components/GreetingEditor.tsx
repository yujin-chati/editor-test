import { useEffect, useState } from 'react';
import EditableElement from './EditableElement';
import SlimToolbar from './SlimToolbar';

interface ComponentStyle {
  position?: string;
  left?: string;
  top?: string;
  width?: string;
  fontSize?: string;
  fontFamily?: string;
  fontWeight?: number | string;
  textAlign?: string;
  lineHeight?: string;
  letterSpacing?: string;
  color?: string;
  whiteSpace?: string;
  textTransform?: string;
  transform?: string;
}

interface Component {
  id: string;
  type: string;
  content: string;
  style: ComponentStyle;
}

interface GreetingTemplate {
  sectionId: string;
  sectionType: string;
  aspectRatio: { x: number; y: number };
  components: Component[];
}

interface GreetingEditorProps {
  templateUrl?: string;
  initialTemplate?: GreetingTemplate;
  onUpdate?: (updatedComponents: Component[]) => void;
}

export default function GreetingEditor({
  templateUrl = '/greeting-default.json',
  initialTemplate,
  onUpdate,
}: GreetingEditorProps) {
  const [template, setTemplate] = useState<GreetingTemplate | null>(
    initialTemplate || null
  );
  const [components, setComponents] = useState<Component[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // 슬림 툴바 열림 여부
  const [isToolbarOpen, setIsToolbarOpen] = useState(false);
  // 인라인 편집 중인 요소
  const [editingElementId, setEditingElementId] = useState<string | null>(null);

  // 화면 크기에 따른 스케일 계산
  const [scale, setScale] = useState(1);

  // 현재 선택된 컴포넌트
  const selectedComponent = components.find((c) => c.id === selectedElementId) || null;

  // 템플릿 로드
  useEffect(() => {
    if (initialTemplate) {
      setTemplate(initialTemplate);
      setComponents(initialTemplate.components);
      return;
    }

    fetch(templateUrl)
      .then((res) => res.json())
      .then((data) => {
        setTemplate(data);
        setComponents(data.components);
      })
      .catch((err) => {
        console.error('Failed to load template:', err);
      });
  }, [templateUrl, initialTemplate]);

  // 스케일 계산 effect
  useEffect(() => {
    if (!template) return;

    const calculateScale = () => {
      const padding = 20;
      const availableWidth = window.innerWidth - padding * 2;
      const availableHeight = window.innerHeight - 150;

      const scaleX = availableWidth / template.aspectRatio.x;
      const scaleY = availableHeight / template.aspectRatio.y;
      const newScale = Math.min(scaleX, scaleY, 1);

      setScale(newScale);
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, [template]);

  // 요소 위치 업데이트
  const handlePositionChange = (elementId: string, x: number, y: number) => {
    const updatedComponents = components.map((comp) => {
      if (comp.id === elementId) {
        return {
          ...comp,
          style: {
            ...comp.style,
            left: `${x}px`,
            top: `${y}px`,
            transform: undefined,
          },
        };
      }
      return comp;
    });

    setComponents(updatedComponents);
    onUpdate?.(updatedComponents);
  };

  // 텍스트 내용 업데이트 (인라인 편집)
  const handleContentChange = (elementId: string, newContent: string) => {
    const updatedComponents = components.map((comp) => {
      if (comp.id === elementId) {
        return {
          ...comp,
          content: newContent,
        };
      }
      return comp;
    });

    setComponents(updatedComponents);
    onUpdate?.(updatedComponents);
    setEditingElementId(null); // 편집 종료
  };

  // 스타일 업데이트
  const handleStyleChange = (newStyle: ComponentStyle) => {
    if (!selectedElementId) return;

    const updatedComponents = components.map((comp) => {
      if (comp.id === selectedElementId) {
        return {
          ...comp,
          style: {
            ...comp.style,
            ...newStyle,
          },
        };
      }
      return comp;
    });

    setComponents(updatedComponents);
    onUpdate?.(updatedComponents);
  };

  // 폰트 사이즈 업데이트 (핀치 줌)
  const handleFontSizeChange = (elementId: string, newFontSize: string, newWidth?: string) => {
    const updatedComponents = components.map((comp) => {
      if (comp.id === elementId) {
        // 기존 fontSize와 새 fontSize의 비율 계산
        const oldFontSize = parseFloat(String(comp.style.fontSize).replace('px', '')) || 16;
        const newFontSizeValue = parseFloat(newFontSize.replace('px', ''));
        const ratio = newFontSizeValue / oldFontSize;

        // lineHeight도 비례해서 변경
        let newLineHeight: string | undefined;
        if (comp.style.lineHeight) {
          const oldLineHeight = parseFloat(String(comp.style.lineHeight).replace('px', ''));
          newLineHeight = `${Math.round(oldLineHeight * ratio * 10) / 10}px`;
        }

        return {
          ...comp,
          style: {
            ...comp.style,
            fontSize: newFontSize,
            ...(newWidth && { width: newWidth }),
            ...(newLineHeight && { lineHeight: newLineHeight }),
          },
        };
      }
      return comp;
    });

    setComponents(updatedComponents);
    onUpdate?.(updatedComponents);
  };

  // 요소 선택 시 툴바 열기
  const handleElementSelect = (elementId: string) => {
    setSelectedElementId(elementId);
    setIsToolbarOpen(true);
  };

  // 인라인 편집 시작
  const handleStartEdit = (elementId: string) => {
    setEditingElementId(elementId);
  };

  // 툴바 닫기
  const handleToolbarClose = () => {
    setIsToolbarOpen(false);
    setSelectedElementId(null);
    setEditingElementId(null);
  };

  // 배경 클릭 시 선택 해제
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedElementId(null);
      setIsToolbarOpen(false);
      setEditingElementId(null);
    }
  };

  if (!template) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
        }}
      >
        <div>Loading...</div>
      </div>
    );
  }

  const { aspectRatio } = template;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#e8e8e8',
        padding: '10px',
      }}
      onClick={handleBackgroundClick}
    >
      {/* 카드 컨테이너 */}
      <div
        style={{
          position: 'relative',
          width: `${aspectRatio.x}px`,
          height: `${aspectRatio.y}px`,
          backgroundColor: '#fff',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          borderRadius: '4px',
          overflow: 'hidden',
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
        onClick={handleBackgroundClick}
      >
        {/* 각 컴포넌트 렌더링 */}
        {components.map((component) => {
          const { id, type, content, style } = component;

          let left = 0;
          let top = 0;
          let elementWidth = aspectRatio.x;

          if (style.width) {
            if (style.width === '100%') {
              elementWidth = aspectRatio.x;
            } else {
              elementWidth = parseFloat(String(style.width).replace('px', '')) || aspectRatio.x;
            }
          }

          if (style.left === '50%' && style.transform?.includes('translateX(-50%)')) {
            left = (aspectRatio.x - elementWidth) / 2;
          } else {
            left = parseFloat(String(style.left).replace('px', '')) || 0;
          }
          top = parseFloat(String(style.top).replace('px', '')) || 0;

          // 텍스트 스타일 객체
          const textStyle: React.CSSProperties = {
            fontSize: style.fontSize,
            fontFamily: style.fontFamily,
            fontWeight: style.fontWeight as number | undefined,
            textAlign: style.textAlign as 'left' | 'center' | 'right',
            lineHeight: style.lineHeight,
            letterSpacing: style.letterSpacing,
            color: style.color,
            whiteSpace: (style.whiteSpace as 'pre-line' | 'nowrap') || 'pre-line',
            textTransform: style.textTransform as 'uppercase' | 'lowercase' | 'capitalize' | 'none',
            width: style.width === '100%' ? `${aspectRatio.x}px` : style.width,
          };

          return (
            <EditableElement
              key={id}
              id={id}
              isSelected={selectedElementId === id}
              isEditing={editingElementId === id}
              position={{ x: left, y: top }}
              content={content}
              style={textStyle}
              onSelect={() => handleElementSelect(id)}
              onPositionChange={(x, y) => handlePositionChange(id, x, y)}
              onStartEdit={() => handleStartEdit(id)}
              onContentChange={(newContent) => handleContentChange(id, newContent)}
              onFontSizeChange={(newFontSize, newWidth) => handleFontSizeChange(id, newFontSize, newWidth)}
              containerBounds={{ width: aspectRatio.x, height: aspectRatio.y }}
              guidelines={{
                vertical: [aspectRatio.x / 2],
                horizontal: [aspectRatio.y / 2],
              }}
            >
              {type === 'text' && (
                <div style={textStyle}>
                  {content}
                </div>
              )}
            </EditableElement>
          );
        })}
      </div>

      {/* 슬림 툴바 (요소 클릭 시 열림) */}
      {selectedComponent && isToolbarOpen && (
        <SlimToolbar
          style={selectedComponent.style}
          onStyleChange={handleStyleChange}
          onClose={handleToolbarClose}
        />
      )}
    </div>
  );
}
