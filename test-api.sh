#!/bin/bash
# API 테스트 스크립트

BASEURL="http://localhost:3000"

echo "=== cocobebe API 테스트 ==="
echo ""

# 데이터베이스 연결 테스트
echo "1. 데이터베이스 연결 확인..."
curl -s "$BASEURL/api/db-test" | jq . || echo "{ \"status\": \"failed\" }"
echo ""

# 교직원 목록 조회
echo "2. 교직원 목록 조회..."
curl -s "$BASEURL/api/teachers" | jq . || echo "[]"
echo ""

# 새 교직원 추가 (관리자 권한 필요)
echo "3. 새 교직원 추가..."
curl -s -X POST "$BASEURL/api/teachers" \
  -H "Content-Type: application/json" \
  -H "x-user-role: admin" \
  -d '{
    "name": "테스트 선생님",
    "join_date": "2024-03-01",
    "role": "teacher",
    "password": "1234",
    "class_name": "1학년"
  }' | jq .
echo ""

# 다시 교직원 목록 조회
echo "4. 교직원 목록 (추가 후)..."
curl -s "$BASEURL/api/teachers" | jq . || echo "[]"
echo ""

echo "테스트 완료!"
