#!/bin/bash
curl -s -X POST http://localhost:3000/api/cargas \
  -F "proceso=BUEN_COMIENZO" \
  -F "periodo=2024-05" \
  -F "archivo=@test-buen-comienzo.xlsx" | jq '.' 2>&1 | head -80
