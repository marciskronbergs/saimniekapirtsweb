# Saimnieku Pirtis: video sērija "Viens lauks" (14 pointing reels)

Šis zars (`social/video`) ir darba materiāls video montāžai. **Neapvienot ar `main`.** Video failus necommitot (.gitignore tos izslēdz).

## Saturs
- `14_scenariji.md`: 14 scenāriji (āķis LV/EN, punkti, uz ko rāda, balss teksts EN, garums). Status: melnraksts, gaida Mārča apstiprinājumu.
- `council/`: LLM padomes audits (jautājums, anonimizētās atbildes, 3 recenzijas). Uzvarēja variants "B" (Borda 9 pret 5 un 4).
- `hyperframes/build.py`: ģenerē HyperFrames kompozīciju 1080×1920 no `spec.json` (LV vai EN ekrāna teksts, vārdu subtitri, punktu attēli, beigu kartīte).
- `hyperframes/spec.json`: piemērs, reels #3 "Palaist vaļā ≠ nedarīt neko".
- `hyperframes/assets/`: Inter Display fonti (OFL) un gsap.min.js (lokāli, jo CDN renderā var būt bloķēts).

## Kā uzbūvēt vienu video
1. Ieliec `hyperframes/assets/` attēlus no `spec.json` (piemērā tie ir `public/giftcard/a4_*.jpg` un `logo_on_light.png`).
2. Balss segmenti: `hyperframes/assets/vo/s0.wav … sN.wav` (s0 = āķis, s1… = punkti). Gala versijā ElevenLabs ar Mārča balss klonu. Testam var lietot `npx hyperframes tts "…" -v am_michael -o s0.wav` (vajag `pip install kokoro-onnx soundfile`).
3. `spec.json` katram segmentam norādi `speech` [sākums, beigas] sekundēs un `pauses` (ar `ffmpeg -af silencedetect=n=-40dB:d=0.12`). Ja ir ElevenLabs vārdu laiki, tos var ielikt tieši.
4. `python3 build.py spec.json lv out_lv` (vai `en out_en`), tad `cd out_lv && npx hyperframes check && npx hyperframes render -o ../reel.mp4`.

## Kas jāaizstāj ar īsto materiālu
- SVG siluets (`#person` build.py) ir aizvietotājs. Īstajā versijā aizstāt ar Mārča pointing klipu (`<video>` labajā pusē, `muted`), 6 klipi pa 10–20 s:
  1. Rāda augšā pa kreisi.
  2. Rāda augšā pa kreisi un skatās uz attēlu.
  3. Rāda augšā pa labi.
  4. Rāda kamerā.
  5. Atvērtas plaukstas.
  6. Kluss skatiens kamerā.
- Attēli: īsti pirts kadri no Drive "Pirts klipi" (atslēgas, slotu siešana, tvaiks, krāsns utt., skat. "RĀDA UZ" scenārijos).

## Noteikumi saturam
Nav temperatūru (pirts rituāli ir 60–70 °C, neminēt), nav alkohola, nav medicīnisku/veselības apgalvojumu, rituāla ilgums ir "tik ilgi, cik vajag". Latviešu valodai jābūt dabiskai.

## Kvalitātes vārti (lietotāja prasība)
Katru gatavo video pirms rādīšanas lietotājam vērtē `/llm-council` (ar ChatGPT, ja pieejams). Padome saņem kadru kontaktlapu, transkriptu, metadatus un audio līmeņus un vērtē pēc kritērijiem: āķis, ritms, skaņa, subtitri, kadrējums, zīmols, noteikumi. Lietotājam rāda tikai 10/10. Montāžā izgriež klusumus, bet nekad negriež vārda vai teikuma vidū; skaļumu normalizē ar loudnorm (−14 LUFS).
