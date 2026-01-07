# Greeting Editor

모바일 청첩장/인사장 텍스트 편집기 컴포넌트

## Features

- **인라인 편집 모드**: 텍스트를 직접 클릭해서 편집
- **모달 편집 모드**: 전체 화면 모달에서 편집 (인스타그램 스타일)
- **드래그 이동**: 텍스트 요소를 드래그해서 위치 변경
- **핀치 줌 / 코너 드래그**: 텍스트 크기 조절 (fontSize, width, lineHeight 비례 변경)
- **스냅 가이드**: 중앙 정렬 스냅 기능
- **반응형 디자인**: iPhone SE (375px) 대응

## Tech Stack

- React 19
- TypeScript
- Vite
- react-moveable (드래그, 스케일, 핀치 줌)

## Getting Started

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build
```

## Usage

```tsx
import GreetingEditor from './components/GreetingEditor';
import GreetingEditorModal from './components/GreetingEditorModal';

// 인라인 편집 모드
<GreetingEditor
  templateUrl="/greeting-default.json"
  onUpdate={(components) => console.log(components)}
/>

// 모달 편집 모드
<GreetingEditorModal
  templateUrl="/greeting-default.json"
  onUpdate={(components) => console.log(components)}
/>
```

## Template JSON Format

```json
{
  "sectionId": "greeting-default",
  "sectionType": "greeting",
  "aspectRatio": { "x": 335, "y": 515 },
  "components": [
    {
      "id": "unique-id",
      "type": "text",
      "content": "텍스트 내용",
      "style": {
        "position": "absolute",
        "left": "50%",
        "top": "100px",
        "fontSize": "14px",
        "fontFamily": "NanumMyeongjo, serif",
        "textAlign": "center",
        "lineHeight": "26px",
        "color": "rgb(51, 51, 51)"
      }
    }
  ]
}
```

## Components

| Component | Description |
|-----------|-------------|
| `GreetingEditor` | 인라인 편집 + SlimToolbar |
| `GreetingEditorModal` | 모달 편집 + 전체 화면 툴바 |
| `EditableElement` | 드래그/스케일 가능한 요소 래퍼 |
| `TextEditModal` | 전체 화면 텍스트 편집 모달 |
| `SlimToolbar` | 하단 고정 스타일 툴바 |

## License

MIT
