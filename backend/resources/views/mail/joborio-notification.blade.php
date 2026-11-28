<x-mail::message>
# {{ $title }}

{{ $body }}

<x-mail::button :url="$dashboardUrl">
View in Upclift
</x-mail::button>

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
