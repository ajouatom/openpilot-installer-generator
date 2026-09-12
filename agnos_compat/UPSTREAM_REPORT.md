# i.carrotpilot.app 관리자에게 전달할 수정 요청

comma four / AGNOS `19.6.3-carrot`에서 현재
`i.carrotpilot.app/carrot-wip` 및 `/carrot-cinque_v2`가 제공하는
installer를 실제 실행하면 다음 오류로 종료 코드 1을 반환합니다.

```text
WARNING: COMMA: Failed to bind Wayland globals
FATAL: COMMA: Failed to initialize Wayland
```

문제 바이너리는 1,270,680바이트이며 ELF Build ID는
`88124db1fcce4e2caa95ec0f070b7c1e65b48439`입니다.
화면 초기화에서 종료하므로 Git clone과 `/data/continue.sh` 생성에
도달하지 않습니다. OS 셋업 루프는 installer가 종료되고 continue.sh가
없으면 다시 셋업을 표시합니다. Python 패키지 설치 단계의 오류가 아닙니다.

같은 기기의 AGNOS 내장 `/usr/comma/installer`는 화면 초기화에 성공했습니다.
이 호환 템플릿의 예약된 저장소/브랜치 문자열만 변경한 Carrot installer는
빈 `/data`를 제공하는 독립 마운트 공간에서 실제 다운로드, 체크아웃,
설치 완료 파일 생성까지 성공하고 종료 코드 0을 반환했습니다.

요청 사항:

1. 배포용 AGNOS installer 템플릿의 화면 백엔드가 해당 기기/OS와 호환되도록
   교체하거나, User-Agent의 AGNOS 버전과 기기 종류에 따라 검증된 템플릿을
   선택해 주세요. 모든 기기에 최신 템플릿을 일괄 적용하지 않는 것이 좋습니다.
2. 템플릿 소스를 검증된 버전 또는 커밋으로 고정하고, 교체할 때는
   화면 초기화뿐 아니라 빈 설치 경로에서 continue.sh 생성까지 검증해 주세요.
3. 수정된 바이너리가 실제 설치 URL에서 내려오는지 캐시를 포함해 확인해 주세요.

검증된 호환 템플릿:

- [원본과 생성 스크립트](https://github.com/ajouatom/openpilot-installer-generator/tree/df6f48de28e47afd6662e0a9184ac11d48733f26/agnos_compat)
- [Carrot 브랜치용 배포 파일](https://github.com/ajouatom/openpilot-installer-generator/releases/tag/agnos-19.6.3-compat-20260912)
- 원본 SHA-256: `85f6d9e54286a3842920d6967b187478b4e43d6171c331d72d3fb3102106e101`

이 검증은 comma four / AGNOS 19.6.3-carrot에서 수행했습니다.
다른 기기와 OS 버전은 각각 호환성을 확인해야 합니다.
