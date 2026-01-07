import { useRef, useEffect } from 'react';
import Moveable from 'react-moveable';

interface EditableElementProps {
  id: string;
  children: React.ReactNode;
  isSelected: boolean;
  isEditing: boolean;
  position: { x: number; y: number };
  content: string;
  style: React.CSSProperties;
  onSelect: () => void;
  onPositionChange: (x: number, y: number) => void;
  onStartEdit: () => void;
  onContentChange: (newContent: string) => void;
  onFontSizeChange?: (newFontSize: string, newWidth?: string) => void;
  containerBounds?: { width: number; height: number };
  guidelines?: { vertical: number[]; horizontal: number[] };
}

/**
 * 편집 가능한 요소 래퍼 컴포넌트
 * - 클릭: 선택 + 편집 모드
 * - 드래그: 이동
 */
export default function EditableElement({
  id: _id,
  children,
  isSelected,
  isEditing,
  position,
  content,
  style,
  onSelect,
  onPositionChange,
  onStartEdit,
  onContentChange,
  onFontSizeChange,
  containerBounds = { width: 335, height: 515 },
  guidelines = { vertical: [167.5], horizontal: [257.5] },
}: EditableElementProps) {
  const targetRef = useRef<HTMLDivElement>(null);
  const editableRef = useRef<HTMLDivElement>(null);
  const moveableRef = useRef<Moveable>(null);

  // 드래그 감지용
  const isDraggingRef = useRef(false);
  const mouseDownPosRef = useRef({ x: 0, y: 0 });

  // 핀치 줌용 - 초기 fontSize, width 저장
  const initialFontSizeRef = useRef<number>(0);
  const initialWidthRef = useRef<number>(0);

  // position이 변경되면 DOM 직접 업데이트
  useEffect(() => {
    if (targetRef.current) {
      targetRef.current.style.transform = `translate(${position.x}px, ${position.y}px)`;
    }
  }, [position.x, position.y]);

  // 편집 모드 진입 시 포커스 및 커서 위치 설정
  useEffect(() => {
    if (isEditing && editableRef.current) {
      // 약간의 딜레이 후 포커스 (Moveable 이벤트와 충돌 방지)
      setTimeout(() => {
        if (editableRef.current) {
          editableRef.current.focus();

          // 커서를 끝으로 이동
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(editableRef.current);
          range.collapse(false);
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      }, 50);
    }
  }, [isEditing]);

  // 편집 내용 저장
  const handleBlur = () => {
    if (editableRef.current && isEditing) {
      const html = editableRef.current.innerHTML;
      const plainText = html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<div>/gi, '\n')
        .replace(/<\/div>/gi, '')
        .replace(/<[^>]*>/g, '');
      onContentChange(plainText);
    }
  };

  // 엔터 키 처리
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;

      const range = selection.getRangeAt(0);
      range.deleteContents();

      const br = document.createElement('br');
      range.insertNode(br);

      range.setStartAfter(br);
      range.setEndAfter(br);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

  // 클릭 핸들러
  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();

    // 드래그했으면 클릭 무시
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      return;
    }

    // 편집 중이면 텍스트 내 클릭이므로 무시
    if (isEditing) return;

    // 클릭 = 선택 + 편집 모드 진입
    onSelect();
    onStartEdit();
  };

  return (
    <>
      <div
        ref={targetRef}
        onMouseDown={(e) => {
          mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
          isDraggingRef.current = false;
        }}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          mouseDownPosRef.current = { x: touch.clientX, y: touch.clientY };
          isDraggingRef.current = false;
        }}
        onMouseUp={handleClick}
        onTouchEnd={handleClick}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          transform: `translate(${position.x}px, ${position.y}px)`,
          cursor: isEditing ? 'text' : 'move',
          outline: isSelected ? '2px solid #60C0BA' : '1px dashed #999',
          outlineOffset: isSelected ? '4px' : '2px',
          borderRadius: '2px',
        }}
      >
        {isEditing ? (
          // 인라인 편집 모드
          <div
            ref={editableRef}
            contentEditable
            suppressContentEditableWarning
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            dangerouslySetInnerHTML={{
              __html: content.replace(/\n/g, '<br>')
            }}
            style={{
              ...style,
              outline: 'none',
              minWidth: '50px',
              minHeight: '1em',
              caretColor: '#60C0BA',
            }}
          />
        ) : (
          children
        )}

        {/* Move 아이콘 - 선택됐지만 편집 중 아닐 때 */}
        {isSelected && !isEditing && (
          <div
            style={{
              position: 'absolute',
              right: '-12px',
              bottom: '-12px',
              width: '24px',
              height: '24px',
              borderRadius: '100px',
              backgroundColor: '#60C0BA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'move',
              zIndex: 1,
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 13 13"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6.5 1V12M6.5 1L4 3.5M6.5 1L9 3.5M6.5 12L4 9.5M6.5 12L9 9.5M1 6.5H12M1 6.5L3.5 4M1 6.5L3.5 9M12 6.5L9.5 4M12 6.5L9.5 9"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Moveable: 편집 중 아닐 때만 드래그 가능 */}
      {!isEditing && targetRef.current && (
        <Moveable
          ref={moveableRef}
          target={targetRef.current}
          draggable={true}
          scalable={true}
          pinchable={true}
          snappable={true}
          snapThreshold={5}
          isDisplaySnapDigit={false}
          snapDirections={{ center: true, middle: true }}
          elementSnapDirections={{ center: true, middle: true }}
          verticalGuidelines={guidelines.vertical}
          horizontalGuidelines={guidelines.horizontal}
          elementGuidelines={[]}
          hideDefaultLines={true}
          keepRatio={true}
          onDragStart={() => {
            isDraggingRef.current = false;
          }}
          onDrag={(e) => {
            // 5px 이상 이동하면 드래그로 판정
            const dx = Math.abs(e.clientX - mouseDownPosRef.current.x);
            const dy = Math.abs(e.clientY - mouseDownPosRef.current.y);
            if (dx > 5 || dy > 5) {
              isDraggingRef.current = true;
            }

            // transform으로 이동
            e.target.style.transform = e.transform;
          }}
          onDragEnd={(e) => {
            // transform에서 translate 값 추출
            const matrix = new DOMMatrix(e.target.style.transform);
            const x = matrix.m41;
            const y = matrix.m42;

            onPositionChange(x, y);
            isDraggingRef.current = false;
          }}
          onScaleStart={() => {
            // 현재 fontSize, width 저장
            const currentFontSize = parseFloat(String(style.fontSize).replace('px', '')) || 16;
            const currentWidth = parseFloat(String(style.width).replace('px', '')) || containerBounds.width;
            initialFontSizeRef.current = currentFontSize;
            initialWidthRef.current = currentWidth;
          }}
          onScale={(e) => {
            // 현재 위치 유지하면서 scale 적용
            const scaleValue = e.scale[0];
            e.target.style.transform = `translate(${position.x}px, ${position.y}px) scale(${scaleValue})`;
          }}
          onScaleEnd={(e) => {
            // 최종 scale 값으로 fontSize, width 계산
            const scale = e.lastEvent?.scale?.[0] || 1;
            const newFontSize = Math.round(initialFontSizeRef.current * scale);
            const newWidth = Math.round(initialWidthRef.current * scale);
            const clampedFontSize = Math.max(8, Math.min(72, newFontSize));
            const clampedWidth = Math.max(50, Math.min(containerBounds.width, newWidth));

            // fontSize, width 업데이트
            if (onFontSizeChange) {
              onFontSizeChange(`${clampedFontSize}px`, `${clampedWidth}px`);
            }

            // scale 리셋 (fontSize가 변경되었으므로)
            e.target.style.transform = `translate(${position.x}px, ${position.y}px)`;

            // 컨트롤 포인트 위치 업데이트 (약간의 딜레이 후)
            setTimeout(() => {
              moveableRef.current?.updateRect();
            }, 0);
          }}
          bounds={{
            left: -Infinity,
            top: 0,
            right: Infinity,
            bottom: containerBounds.height,
          }}
          origin={false}
        />
      )}
    </>
  );
}
