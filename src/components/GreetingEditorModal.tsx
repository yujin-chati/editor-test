import { useEffect, useState } from 'react';
import EditableElementModal from './EditableElementModal';
import TextEditModal from './TextEditModal';

const getBaseViewportHeight = () => {
  if (typeof window === 'undefined') return 0;
  return window.innerHeight || document.documentElement.clientHeight || 0;
};

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

interface GreetingEditorModalProps {
  templateUrl?: string;
  initialTemplate?: GreetingTemplate;
  onUpdate?: (updatedComponents: Component[]) => void;
}

export default function GreetingEditorModal({
  templateUrl = '/greeting-default.json',
  initialTemplate,
  onUpdate,
}: GreetingEditorModalProps) {
  const baseViewportHeightRef = useState(getBaseViewportHeight())[0];
  const [template, setTemplate] = useState<GreetingTemplate | null>(
    initialTemplate || null
  );
  const [components, setComponents] = useState<Component[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // 텍스트 편집 모달
  const [editingComponent, setEditingComponent] = useState<Component | null>(null);
  // 편집 시작 시점의 초기값 (초기화용)
  const [initialEditContent, setInitialEditContent] = useState<string | undefined>(undefined);
  const [initialEditStyle, setInitialEditStyle] = useState<ComponentStyle | undefined>(undefined);

  // 화면 크기에 따른 스케일 계산
  const [scale, setScale] = useState(1);

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

  // 스케일 계산 effect (편집 모달이 열렸을 때는 keyboard resize에 반응하지 않도록 중단)
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

    // 모달이 닫혀 있을 때만 리사이즈에 반응
    if (!editingComponent) {
      calculateScale();
      window.addEventListener('resize', calculateScale);
    }

    return () => {
      window.removeEventListener('resize', calculateScale);
    };
  }, [template, editingComponent]);

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

  // 텍스트 내용 업데이트 (모달에서)
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
    setEditingComponent(null);
  };

  // 스타일 업데이트 (모달에서 호출)
  const handleStyleChange = (elementId: string, newStyle: ComponentStyle) => {
    const updatedComponents = components.map((comp) => {
      if (comp.id === elementId) {
        const updatedComp = {
          ...comp,
          style: {
            ...comp.style,
            ...newStyle,
          },
        };
        // editingComponent도 업데이트
        setEditingComponent(updatedComp);
        return updatedComp;
      }
      return comp;
    });

    setComponents(updatedComponents);
    onUpdate?.(updatedComponents);
  };

  // 요소 선택 시
  const handleElementSelect = (elementId: string) => {
    setSelectedElementId(elementId);
  };

  // 클릭 시 모달 열기
  const handleElementClick = (component: Component) => {
    // 초기값 저장 (초기화용)
    setInitialEditContent(component.content);
    setInitialEditStyle({ ...component.style });
    setEditingComponent(component);
  };

  // 배경 클릭 시 선택 해제
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedElementId(null);
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
      className="editor-container"
      style={{
        backgroundColor: '#000',
        ...(editingComponent && {
          height: `${baseViewportHeightRef}px`,
          position: 'fixed',
          inset: 0,
        }),
      }}
      onClick={handleBackgroundClick}
    >
      {/* 카드 영역 */}
      <div
        style={{
          position: 'relative',
          width: `${aspectRatio.x * scale}px`,
          height: `${aspectRatio.y * scale}px`,
          backgroundColor: '#fff',
          borderRadius: '4px',
          overflow: 'hidden',
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

          // scale 적용된 위치와 크기
          const scaledLeft = left * scale;
          const scaledTop = top * scale;
          const scaledWidth = elementWidth * scale;

          // 폰트 사이즈 scale 적용
          const baseFontSize = parseFloat(String(style.fontSize).replace('px', '')) || 16;
          const scaledFontSize = baseFontSize * scale;

          // letterSpacing scale 적용
          const baseLetterSpacing = parseFloat(String(style.letterSpacing).replace('px', '')) || 0;
          const scaledLetterSpacing = baseLetterSpacing * scale;

          // 텍스트 스타일 객체
          const textStyle: React.CSSProperties = {
            fontSize: `${scaledFontSize}px`,
            fontFamily: style.fontFamily,
            fontWeight: style.fontWeight as number | undefined,
            textAlign: style.textAlign as 'left' | 'center' | 'right',
            lineHeight: style.lineHeight,
            letterSpacing: `${scaledLetterSpacing}px`,
            color: style.color,
            whiteSpace: (style.whiteSpace as 'pre-line' | 'nowrap') || 'pre-line',
            textTransform: style.textTransform as 'uppercase' | 'lowercase' | 'capitalize' | 'none',
            width: `${scaledWidth}px`,
          };

          return (
            <EditableElementModal
              key={id}
              id={id}
              isSelected={selectedElementId === id}
              position={{ x: scaledLeft, y: scaledTop }}
              onSelect={() => handleElementSelect(id)}
              onPositionChange={(x, y) => handlePositionChange(id, x / scale, y / scale)}
              onClick={() => handleElementClick(component)}
              onRelease={() => setSelectedElementId(null)}
              containerBounds={{ width: aspectRatio.x * scale, height: aspectRatio.y * scale }}
              guidelines={{
                vertical: [(aspectRatio.x * scale) / 2],
                horizontal: [(aspectRatio.y * scale) / 2],
              }}
              disabled={Boolean(editingComponent)}
            >
              {type === 'text' && (
                <div style={textStyle}>
                  {content}
                </div>
              )}
            </EditableElementModal>
          );
        })}
      </div>

      {/* 텍스트 편집 모달 (하단에 툴바 포함) */}
      {editingComponent && (
        <TextEditModal
          component={editingComponent}
          initialContent={initialEditContent}
          initialStyle={initialEditStyle}
          onSave={(newContent) => handleContentChange(editingComponent.id, newContent)}
          onStyleChange={(newStyle) => handleStyleChange(editingComponent.id, newStyle)}
          onClose={() => setEditingComponent(null)}
        />
      )}
    </div>
  );
}
