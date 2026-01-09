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
  onDeselect: () => void;
  onPositionChange: (x: number, y: number) => void;
  onStartEdit: () => void;
  onContentChange: (newContent: string) => void;
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
  onDeselect,
  onPositionChange,
  onStartEdit,
  onContentChange,
  containerBounds = { width: 335, height: 515 },
  guidelines = { vertical: [167.5], horizontal: [257.5] },
}: EditableElementProps) {
  const targetRef = useRef<HTMLDivElement>(null);
  const editableRef = useRef<HTMLDivElement>(null);

  // 드래그 감지용
  const isDraggingRef = useRef(false);
  const mouseDownPosRef = useRef({ x: 0, y: 0 });

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

  // 클릭 핸들러 - 클릭(탭)하면 바로 선택 + 편집 모드
  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();

    // 드래그했으면 클릭 무시 (드래그 후에는 선택 상태만 유지)
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      return;
    }

    // 편집 중이면 텍스트 내 클릭이므로 무시
    if (isEditing) return;

    // 클릭하면 바로 선택 + 편집 모드 진입
    if (!isSelected) {
      onSelect();
    }
    // 선택 후 바로 편집 모드 진입
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
          zIndex: isSelected ? 100 : 1,
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

      {/* Moveable: 드래그만 지원 (핀치 줌 제거) */}
      {targetRef.current && (
        <Moveable
          target={targetRef.current}
          draggable={true}
          snappable={true}
          snapThreshold={5}
          isDisplaySnapDigit={false}
          snapDirections={{ center: true, middle: true }}
          elementSnapDirections={{ center: true, middle: true }}
          verticalGuidelines={guidelines.vertical}
          horizontalGuidelines={guidelines.horizontal}
          elementGuidelines={[]}
          hideDefaultLines={true}
          onDragStart={() => {
            isDraggingRef.current = false;
          }}
          onDrag={(e) => {
            // 편집 중이면 드래그 무시
            if (isEditing) return;

            // 5px 이상 이동하면 드래그로 판정
            const dx = Math.abs(e.clientX - mouseDownPosRef.current.x);
            const dy = Math.abs(e.clientY - mouseDownPosRef.current.y);
            if (dx > 5 || dy > 5) {
              isDraggingRef.current = true;
              // 드래그 시작 시 선택 상태로 전환 (줌 없이)
              if (!isSelected) {
                onSelect();
              }
            }

            // 드래그 중일 때만 transform 이동
            if (isDraggingRef.current) {
              e.target.style.transform = e.transform;
            }
          }}
          onDragEnd={(e) => {
            // 실제로 드래그가 발생했을 때만 위치 업데이트
            if (isDraggingRef.current && !isEditing) {
              // transform에서 translate 값 추출
              const matrix = new DOMMatrix(e.target.style.transform);
              const x = matrix.m41;
              const y = matrix.m42;

              onPositionChange(x, y);
              // 드래그 끝나면 선택 해제
              onDeselect();
            }
            // 항상 드래그 상태 리셋
            isDraggingRef.current = false;
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
