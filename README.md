    1.	개발 중엔 npx serverless offline --stage local 로 빠른 핫리로드/테스트
    2.	PR 머지 직전이나 네이티브 애드온 추가 시 sam build && sam local invoke 로 한 차례 실런타임 검증
    3.	serverless deploy --stage dev|prod 로 배포

현재 serverless에서 node24를 지원하지 않음. 올해 Q3발표 기다려보는중.