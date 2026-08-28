from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Member, BureauMember, MembershipApplication, AssociationSettings


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "email"]


class MemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    full_name = serializers.CharField(read_only=True)
    email = serializers.CharField(read_only=True)
    role_display = serializers.CharField(source="get_role_display", read_only=True)
    account_status_display = serializers.CharField(source="get_account_status_display", read_only=True)

    class Meta:
        model = Member
        fields = [
            "id", "user", "full_name", "email", "role", "role_display",
            "account_status", "account_status_display",
            "membership_status", "membership_date", "phone", "photo",
            "bio", "show_in_directory", "joined_date", "is_active_member",
        ]


class MemberPublicSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    photo = serializers.ImageField(read_only=True)
    photo_id = serializers.IntegerField(source="id", read_only=True)

    class Meta:
        model = Member
        fields = ["id", "photo_id", "full_name", "photo", "bio", "role"]


class BureauMemberSerializer(serializers.ModelSerializer):
    member = MemberPublicSerializer(read_only=True)
    position_display = serializers.CharField(source="get_position_display", read_only=True)

    class Meta:
        model = BureauMember
        fields = [
            "id", "member", "position", "position_display",
            "display_order", "mandate_start", "mandate_end",
        ]


class MemberRegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    phone = serializers.CharField(max_length=20, required=False, default="")
    rgpd_consent = serializers.BooleanField()

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Ce nom d'utilisateur existe déjà.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Cet email est déjà utilisé.")
        return value

    def validate_rgpd_consent(self, value):
        if not value:
            raise serializers.ValidationError("Le consentement RGPD est obligatoire.")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data["first_name"],
            last_name=validated_data["last_name"],
        )
        Member.objects.create(
            user=user,
            phone=validated_data.get("phone", ""),
            rgpd_consent=validated_data["rgpd_consent"],
        )
        return user


class MembershipApplicationSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.get_full_name", read_only=True)
    user_email = serializers.CharField(source="user.email", read_only=True)
    reviewed_by_name = serializers.CharField(source="reviewed_by.get_full_name", read_only=True, default="")
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = MembershipApplication
        fields = [
            "id", "user", "user_name", "user_email",
            "photo", "id_front", "id_back",
            "demand_letter", "supporting_documents", "motivation",
            "status", "status_display", "reviewed_by", "reviewed_by_name",
            "review_note", "created_at", "updated_at",
        ]
        read_only_fields = ["user", "status", "reviewed_by", "created_at", "updated_at"]


class MembershipApplicationCreateSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    phone = serializers.CharField(max_length=20, required=False, default="")
    motivation = serializers.CharField(required=False, default="")
    photo = serializers.ImageField()
    id_front = serializers.ImageField()
    id_back = serializers.ImageField()
    demand_letter = serializers.FileField(required=False, allow_null=True)
    supporting_documents = serializers.FileField(required=False, allow_null=True)
    rgpd_consent = serializers.BooleanField()

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Ce nom d'utilisateur existe déjà.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Cet email est déjà utilisé.")
        return value

    def validate_rgpd_consent(self, value):
        if not value:
            raise serializers.ValidationError("Le consentement RGPD est obligatoire.")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data["first_name"],
            last_name=validated_data["last_name"],
        )
        Member.objects.create(
            user=user,
            phone=validated_data.get("phone", ""),
            rgpd_consent=validated_data["rgpd_consent"],
        )
        app = MembershipApplication.objects.create(
            user=user,
            motivation=validated_data.get("motivation", ""),
            photo=validated_data.get("photo"),
            id_front=validated_data.get("id_front"),
            id_back=validated_data.get("id_back"),
            demand_letter=validated_data.get("demand_letter"),
            supporting_documents=validated_data.get("supporting_documents"),
        )
        return user, app


class AssociationSettingsSerializer(serializers.ModelSerializer):
    collective_photo = serializers.ImageField(read_only=True)
    cover_photo = serializers.ImageField(read_only=True)

    class Meta:
        model = AssociationSettings
        fields = ["id", "collective_photo", "cover_photo", "updated_at"]
