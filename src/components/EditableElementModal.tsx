import { useRef, useEffect } from 'react';
import Moveable from 'react-moveable';

interface EditableElementModalProps {
  id: string;
  children: React.ReactNode;
  isSelected: boolean;
  position: { x: number; y: number };
  onSelect: () => void;
  onPositionChange: (x: number, y: number) => void;
  onClick: () => void;
  onRelease?: () => void;
  containerBounds?: { width: number; height: number };
  guidelines?: { vertical: number[]; horizontal: number[] };
  disabled?: boolean;
}

/**
 * 모달 방식 편집용 요소 래퍼 컴포넌트
 * - 클릭: 모달 열기
 * - 드래그: 이동
 */
export default function EditableElementModal({
  id: _id,
  children,
  isSelected,
  position,
  onSelect,
  onPositionChange,
  onClick,
  onRelease,
  containerBounds = { width: 335, height: 515 },
  guidelines = { vertical: [167.5], horizontal: [257.5] },
  disabled = false,
}: EditableElementModalProps) {
  const targetRef = useRef<HTMLDivElement>(null);

  // 드래그 감지용
  const isDraggingRef = useRef(false);
  const mouseDownPosRef = useRef({ x: 0, y: 0 });
  // 현재 포인터 제스처가 이 요소에서 시작되었는지 여부
  const allowDragRef = useRef(false);

  // position이 변경되면 DOM 직접 업데이트
  useEffect(() => {
    if (targetRef.current) {
      targetRef.current.style.transform = `translate(${position.x}px, ${position.y}px)`;
    }
  }, [position.x, position.y]);

  // 클릭 핸들러 - 드래그가 아니면 모달 열기
  const handleMouseUp = (e: React.MouseEvent) => {
    e.stopPropagation();

    // 마우스 이동 거리 직접 계산
    const dx = Math.abs(e.clientX - mouseDownPosRef.current.x);
    const dy = Math.abs(e.clientY - mouseDownPosRef.current.y);

    // 5px 이상 이동했으면 드래그로 판정, 클릭 무시
    if (dx > 5 || dy > 5 || isDraggingRef.current) {
      isDraggingRef.current = false;
      allowDragRef.current = false;
      onRelease?.();
      return;
    }

    if (!disabled) {
      onSelect();
      onClick();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();

    // 터치 이동 거리 직접 계산
    const touch = e.changedTouches[0];
    const dx = Math.abs(touch.clientX - mouseDownPosRef.current.x);
    const dy = Math.abs(touch.clientY - mouseDownPosRef.current.y);

    // 5px 이상 이동했으면 드래그로 판정, 클릭 무시
    if (dx > 5 || dy > 5 || isDraggingRef.current) {
      isDraggingRef.current = false;
      allowDragRef.current = false;
      onRelease?.();
      return;
    }

    if (!disabled) {
      onSelect();
      onClick();
    }
    allowDragRef.current = false;
  };

  return (
    <>
      <div
        ref={targetRef}
        onMouseDown={(e) => {
          mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
          isDraggingRef.current = false;
          allowDragRef.current = !disabled;
          if (!disabled) {
            onSelect();
          }
        }}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          mouseDownPosRef.current = { x: touch.clientX, y: touch.clientY };
          isDraggingRef.current = false;
          allowDragRef.current = !disabled;
          if (!disabled) {
            onSelect();
          }
        }}
        onMouseUp={handleMouseUp}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          transform: `translate(${position.x}px, ${position.y}px)`,
          cursor: disabled ? 'default' : 'move',
          outline: isSelected ? '2px solid #60C0BA' : '1px dashed #999',
          outlineOffset: isSelected ? '4px' : '2px',
          borderRadius: '2px',
          pointerEvents: disabled ? 'none' : 'auto',
          zIndex: isSelected ? 100 : 1,
        }}
      >
        {children}

        {/* Move 아이콘 - 선택됐을 때 */}
        {isSelected && (
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

      {/* Moveable - 항상 렌더링하되, 드래그는 선택된 요소만 가능 */}
      {targetRef.current && !disabled && (
        <Moveable
          target={targetRef.current}
          draggable={true}
          snappable={true}
          snapCenter={true}
          snapGap={false}
          snapThreshold={5}
          isDisplaySnapDigit={false}
          snapDirections={{ center: true, middle: true }}
          elementSnapDirections={{ center: true, middle: true }}
          verticalGuidelines={guidelines.vertical}
          horizontalGuidelines={guidelines.horizontal}
          elementGuidelines={[]}
          hideDefaultLines={true}
          onDragStart={(e) => {
            // 선택되지 않은 상태에서 바로 드래그하면 먼저 선택 처리
            if (!disabled && !isSelected) {
              onSelect();
            }
            isDraggingRef.current = false;
          }}
          onDrag={(e) => {
            if (disabled || !allowDragRef.current || !isSelected) return;
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
            // 실제 드래그한 경우에만 처리
            if (isDraggingRef.current && allowDragRef.current) {
              const matrix = new DOMMatrix(e.target.style.transform);
              const x = matrix.m41;
              const y = matrix.m42;
              onPositionChange(x, y);
              onRelease?.();
            }
            isDraggingRef.current = false;
            allowDragRef.current = false;
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
