import { useEffect, useState, useRef, useMemo } from 'react';
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
  const [baseScale, setBaseScale] = useState(1);

  // 편집 시 줌/이동용 ref
  const containerRef = useRef<HTMLDivElement>(null);

  // 현재 선택된 컴포넌트
  const selectedComponent = components.find((c) => c.id === selectedElementId) || null;
  // 현재 편집 중인 컴포넌트
  const editingComponent = components.find((c) => c.id === editingElementId) || null;

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

      setBaseScale(newScale);
      if (!selectedElementId) {
        setScale(newScale);
      }
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, [template, selectedElementId]);

  // 편집 중인 요소의 위치 정보 계산 (편집 모드 진입 시 줌 적용)
  const editingElementPosition = useMemo(() => {
    if (!editingComponent || !template) return null;

    const style = editingComponent.style;
    const { aspectRatio } = template;
    let elementWidth = aspectRatio.x;

    if (style.width) {
      if (style.width === '100%') {
        elementWidth = aspectRatio.x;
      } else {
        elementWidth = parseFloat(String(style.width).replace('px', '')) || aspectRatio.x;
      }
    }

    let left = 0;
    if (style.left === '50%' && style.transform?.includes('translateX(-50%)')) {
      left = (aspectRatio.x - elementWidth) / 2;
    } else {
      left = parseFloat(String(style.left).replace('px', '')) || 0;
    }
    const top = parseFloat(String(style.top).replace('px', '')) || 0;

    // 요소 높이 추정 (lineHeight * 줄 수)
    const lineHeight = parseFloat(String(style.lineHeight).replace('px', '')) || 20;
    const lineCount = (editingComponent.content.match(/\n/g) || []).length + 1;
    const elementHeight = lineHeight * lineCount;

    return {
      x: left,
      y: top,
      width: elementWidth,
      height: elementHeight,
      centerX: left + elementWidth / 2,
      centerY: top + elementHeight / 2,
    };
  }, [editingComponent, template]);

  // 편집 모드 진입 시 줌 및 중앙 이동 계산
  const editZoomTransform = useMemo(() => {
    if (!editingElementPosition || !template) {
      return { scale: baseScale, translateX: 0, translateY: 0 };
    }

    const { aspectRatio } = template;
    const zoomScale = Math.min(1.5, baseScale * 1.5); // 1.5배 줌 (최대 1.5)

    // 카드 중앙 좌표
    const cardCenterY = aspectRatio.y / 2;

    // 가로는 항상 카드 중앙 유지 (offsetX = 0), 세로만 요소 위치에 맞춤
    const offsetX = 0;
    const offsetY = (cardCenterY - editingElementPosition.centerY) * zoomScale;

    return {
      scale: zoomScale,
      translateX: offsetX,
      translateY: offsetY,
    };
  }, [editingElementPosition, template, baseScale]);

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

  // 요소 선택 시 툴바 열기
  const handleElementSelect = (elementId: string) => {
    // 이미 편집 중인 다른 요소가 있으면 새 요소도 바로 편집 모드로
    const wasEditing = editingElementId !== null;

    setSelectedElementId(elementId);
    setIsToolbarOpen(true);

    // 이전에 편집 중이었으면 새 요소도 바로 편집 모드로 전환
    if (wasEditing && editingElementId !== elementId) {
      setEditingElementId(elementId);
    }
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
      className="editor-container"
      style={{ backgroundColor: '#000' }}
      onClick={handleBackgroundClick}
    >
      {/* 카드 컨테이너 */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: `${aspectRatio.x}px`,
          height: `${aspectRatio.y}px`,
          backgroundColor: '#fff',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          borderRadius: '4px',
          overflow: 'hidden',
          transform: editingElementId
            ? `scale(${editZoomTransform.scale}) translate(${editZoomTransform.translateX / editZoomTransform.scale}px, ${editZoomTransform.translateY / editZoomTransform.scale}px)`
            : `scale(${baseScale})`,
          transformOrigin: 'center center',
          transition: 'transform 0.3s ease-out',
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
              onDeselect={() => {
                setSelectedElementId(null);
                setIsToolbarOpen(false);
              }}
              onPositionChange={(x, y) => handlePositionChange(id, x, y)}
              onStartEdit={() => handleStartEdit(id)}
              onContentChange={(newContent) => handleContentChange(id, newContent)}
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
