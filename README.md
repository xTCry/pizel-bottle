<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="80" alt="Nest Logo" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/github/package-json/v/xTCry/pizel-bottle?style=flat-square" alt="GitHub package.json version"/>
  <img src="https://img.shields.io/github/last-commit/xTCry/pizel-bottle?style=flat-square" alt="GitHub last commit"/>
</p>

# [Pizel Bottle] Менеджер пиксельного боя

> Простой Web-сервис с API интерфейсом для управления [Пиксельным Боем](https://vk.com/pixelbattle)

---

## Simple API

- `{/api/v1/battle/stats, GET}` - Получить статистику подключений
- `{/api/v1/battle/state, GET}` - Получить текущее состояние
- `{/api/v1/battle/state/:state, POST}` - Установить состояние (state принимает: `1` - пауза, `2` - рисование)
- `{/api/v1/battle/warrior, POST}` - Добавить бойца (body: `embed_url` - ссылка из iframe приложения)
  - `sync=true` - ожидание успешной активации бойца, иначе добавление в очередь без ожидания ответа (по умолчанию `true`)
  - `save=true` - сохранить ссылку в `embed.ini`
- `{/api/v1/battle/warriors, POST}` - аналогично верхнему (body: `embed_url` - принимает множественное значение ссылок)
- `{/api/v1/battle/template, POST}` - загрузить шаблон (body: `url` - ссылка на изображение или локальный путь на машине)
- `{/api/v1/battle/field, GET}` - вывод текущего холста
  - `template=true` - возвращает только шаблон рисования
  - `overlay=true` - возвращает наложение шаблона рисования на текущее поле

### API example

- GET `http://[::1]:3000/api/v1/battle/field` - текущее поле
- GET `{{API_URL}}/v1/battle/field?overlay=true` - текущее поле с наложением шаблона отрисовки
- GET `{{API_URL}}/v1/battle/field?template=true` - чистое поле с шаблоном отрисовки
- POST `{{API_URL}}/v1/battle/state/2` - запустить отрисовку
- POST `{{API_URL}}/v1/battle/warriors?save=true` - добавление новых бойцов по embed ссылкам (ссылки сохранятся в файл)
  - `embed_url[]:https://prod-app7148888-1c35ba98150c.pages-ac.vk-apps.com/index.html?vk_access_token_settings...`
  - `embed_url[]:https://prod-app7148888-1c35ba98150c.pages-ac.vk-apps.com/index.html?vk_access_token_settings...`
  ```json
  {
    "success": 2,
    "fail": 0,
    "userIds": [10123, 20987]
  }
  ```
- GET `{{API_URL}}/v1/battle/stats` - получить тукщую статистику
  ```json
  {
    "stats": {
      "warriors": {
        "total": 3,
        "connected": 3,
        "alive": 2
      }
    }
  }
  ```

---

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```
